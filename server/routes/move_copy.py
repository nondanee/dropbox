import asyncio
import os, datetime
from . import toolbox, fs
from aiohttp import web
from aiohttp_session import get_session

@asyncio.coroutine
def route(request):

    session = yield from get_session(request)
    if 'uid' in session:
        uid = session['uid']
    else:
        return toolbox.javaify(403,"forbidden")

    if request.content_type != "application/x-www-form-urlencoded":
        return toolbox.javaify(400,"wrong content type")

    data = yield from request.post()

    src = data['src'] if 'src' in data else ''
    dst = data['dst'] if 'dst' in data else ''
    names = list(filter(None,list(set(data['name'].split('|'))))) if 'name' in data else ''
    flag = data['flag'] if 'flag' in data else ''

    if not src or not dst or not names:
        return toolbox.javaify(400,"miss parameter")

    if flag and len(names) != 1:
        return toolbox.javaify(400,"bad request")

    for name in names: # directory inner check
        if fs.path_involve(os.path.join(src,name),dst):
            return toolbox.javaify(400,"with loop")


    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        src_directory_id = yield from fs.directory_exists(cursor,uid,src)
        if not src_directory_id:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"source error")

        dst_directory_id = yield from fs.directory_exists(cursor,uid,dst)
        if not dst_directory_id:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"destination error")

        src_file_meta = yield from fs.file_query(cursor,src_directory_id,names)

        if not src_file_meta:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        elif len(src_file_meta) != len(names):
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        dst_file_meta = yield from fs.file_query(cursor,dst_directory_id,names)

        now = datetime.datetime.now()

        if flag == 'cover':
            
            if not len(src_file_meta) == 1 or not len(dst_file_meta) == 1:
                yield from cursor.close()
                connect.close()
                return toolbox.javaify(400,"bad request")

            if src_file_meta[0]['type'] == "directory" or dst_file_meta[0]['type'] == "directory":
                yield from cursor.close()
                connect.close()
                return toolbox.javaify(400,"bad request")

            yield from fs.file_modify(cursor,src_file_meta[0]['id'],{

            })

            if request.match_info["action"] == "move":
                yield from fs.file_delete(cursor,[src_file_meta[0]['id']])

                yield from fs.file_modify(cursor,src_directory_id,{
                    "modify": toolbox.time_str(now),
                })
                
            # both move and copy
            yield from fs.file_modify(cursor,dst_file_meta[0]['id'],{
                "type": src_file_meta[0]['type'],
                "modify": toolbox.time_str(now),
                "size": src_file_meta[0]['size'],
                "md5": src_file_meta[0]['md5'],
            })

            yield from fs.version_sync(cursor,dst_file_meta[0]['id'])

            yield from fs.file_modify(cursor,dst_directory_id,{
                "modify": toolbox.time_str(now),
            })
            
            yield from connect.commit()
            yield from cursor.close()
            connect.close()

            return toolbox.javaify(200,"success")


        elif flag == "keep":
            
            if not len(src_file_meta) == 1 or not len(dst_file_meta) == 1:
                yield from cursor.close()
                connect.close()
                return toolbox.javaify(400,"bad request")

            index = 1
            
            while True:
                rename = "({})".format(index).join(os.path.splitext(names[0]))

                abandon_meta = yield from fs.file_query(cursor,directory_id,[rename])
                if not abandon_meta:
                    break
                elif abandon_meta[0]['status'] == 0:
                    yield from fs.file_delete(cursor,[abandon_meta[0]["id"]])
                    request.app.loop.create_task(fs.file_delete_async(request.app['pool'],[abandon_meta[0]["id"]]))

                index += 1

            if request.match_info["action"] == "move":

                yield from fs.file_modify(cursor,src_file_meta[0]['id'],{
                    "name": rename,
                    "directory": dst_directory_id
                })

                yield from fs.file_modify(cursor,src_directory_id,{
                    "modify": toolbox.time_str(now)
                })
                
            elif request.match_info["action"] == "copy":

                yield from fs.file_copy(cursor,src_file_meta[0]['id'],dst_directory_id,rename)

            yield from fs.file_modify(cursor,dst_directory_id,{
                "modify": toolbox.time_str(now)
            })
            
            yield from connect.commit()
            yield from cursor.close()
            connect.close()

            return toolbox.javaify(200,"success")

        else:

            src_items = {item['name']:item for item in src_file_meta}
            dst_items = {item['name']:item for item in dst_file_meta}

            src_have = set([item['name'] for item in src_file_meta])
            dst_have = set([item['name'] for item in dst_file_meta if item['status'] == 1])

            conflict = src_have & dst_have
            simple = src_have - dst_have

            abandon = [item['id'] for item in dst_file_meta if item['status'] == 0]

            if abandon:
                yield from fs.file_delete(cursor,abandon)
                request.app.loop.create_task(fs.file_delete_async(request.app['pool'],abandon))

            file_ids = [src_items[name]['id'] for name in simple]

            if request.match_info["action"] == "move":

                yield from fs.file_move(cursor,file_ids,dst_directory_id)

                yield from fs.file_modify(cursor,src_directory_id,{
                    "modify": toolbox.time_str(now)
                })

            elif request.match_info["action"] == "copy":

                for file_id in file_ids:
                    yield from file_copy(cursor,file_id,dst_directory_id)

            yield from fs.file_modify(cursor,dst_directory_id,{
                "modify": toolbox.time_str(now)
            })
            
            yield from connect.commit()
            yield from cursor.close()
            connect.close()

            operation = []
            url = "/{}".format(request.match_info["action"])
            action = {'move':'移动','copy':'复制'}[request.match_info["action"]]
            for name in conflict:

                message = [{
                    "path": os.path.join(src,name),
                    "type": src_items[name]['type'],
                    "modify": toolbox.time_utc(src_items[name]['modify']),
                    "size": None if src_items[name]['size'] == 0 else src_items[name]['size']
                },{
                    "path": os.path.join(dst,name),
                    "type": dst_items[name]['type'],
                    "modify": toolbox.time_utc(dst_items[name]['modify']),
                    "size": None if dst_items[name]['size'] == 0 else dst_items[name]['size']
                }]

                form = "src={}&dst={}&name={}".format(src,dst,name)

                if src_items[name]['type'] == 'directory' and dst_items[name]['type'] == 'directory':
                    operation.append([{
                        "title": "{}的位置已经包含了同名的文件夹,请选择你的操作:".format(action),
                        "message": message,
                        "button": [{
                            "name": "保留两个文件夹",
                            "url": url,
                            "data": form + "&flag=keep",
                        }]
                    }])

                elif src_items[name]['type'] != 'directory' and dst_items[name]['type'] == 'directory':
                    operation.append([{
                        "title": "{}的位置已经包含了同名的文件夹,请选择你的操作:".format(action),
                        "message": message,
                        "button": [{
                            "name": "保留文件",
                            "url": url,
                            "data": form + "&flag=keep",
                        }]
                    }])

                elif src_items[name]['type'] != 'directory' and dst_items[name]['type'] != 'directory':
                    operation.append([{
                        "title": "{}的位置已经包含了同名的文件,请选择你的操作:".format(action),
                        "message": message,
                        "button": [{
                            "name": "替换文件",
                            "url": url,
                            "data": "{}&flag=cover".format(form),
                        },{
                            "name": "保留两个文件",
                            "url": url,
                            "data": form + "&flag=keep",
                        }]
                    }])

            if operation:
                return toolbox.javaify(100,"continue",operation)
            else:
                return toolbox.javaify(200,"ok",operation)
