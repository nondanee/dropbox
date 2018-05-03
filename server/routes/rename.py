import asyncio
import os, datetime
from . import toolbox, fs
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

    directory = data['dir'] if 'dir' in data else ''
    name = data['name'] if 'name' in data else ''
    rename = data['rename'] if 'rename' in data else ''
    flag = data['flag'] if 'flag' in data else ''

    if not directory or not name or not rename:
        return toolbox.javaify(400,"miss parameter")

    if rename == name:
        return toolbox.javaify(200,"not modified",{
            "name": name,
            "extension": os.path.splitext(name)[-1][1:],
        })

    if check.name_illegal(rename):
        return toolbox.javaify(400,"name illegal")


    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        directory_id = yield from fs.directory_exists(cursor,uid,directory)

        if not directory_id:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"target error")

        file_meta = yield from fs.file_query(cursor,directory_id,[name,rename])
        source_meta = {}
        destination_meta = {}

        for one in file_meta:
            if one['id'] == name:
                source_meta = one
            elif one['id'] == rename:
                destination_meta = one

        now = datetime.datetime.now()

        if not source_meta:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"source error")

        elif destination_meta and destination_meta['status'] == 0:

            yield from fs.file_delete(cursor,[destination_meta["id"]])
            if destination_meta['type'] =='directory':
                request.app.loop.create_task(fs.file_delete_async(request.app['pool'],[destination_meta["id"]]))

            destination_meta = {}

        # if destination_check and source_check[1] = destination_check[1] == "directory":
        #     new_path = os.path.join(target_dir,new_name)

        #     destination_empty_check = yield from cursor.execute('''
        #         SELECT id, directory FROM repository WHERE uid = %s AND directory LIKE %s
        #     ''',(uid,"{}%".format(new_path)))

        #     if not destination_empty_check:
        #         yield from cursor.execute('''
        #             DELETE FROM repository WHERE id = %s
        #         ''',(source_check[0]))
        #         yield from cursor.execute('''
        #             UPDATE repository SET modify = %s WHERE id = %s
        #         ''',(toolbox.time_str(now),destination_check[0]))
        #         yield from connect.commit()

        if destination_meta and flag != "keep":

            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"file exists",[{
                "title": "此目录下已存在同名文件,是否要保存两个文件:",
                "button": [{
                    "name": "保留两个文件",
                    "url": "/rename",
                    "data": "dir={}&name={}&rename={}&flag=keep".format(directory,name,rename),
                }]
            }])

        elif destination_meta and flag == "keep":

            index = 1
            
            while True:
                rename_try = "({})".format(index).join(os.path.splitext(rename))

                if rename_try == name:
                    yield from cursor.close()
                    connect.close()
                    return toolbox.javaify(200,"not modified",{
                        "name": name,
                        "extension": os.path.splitext(name)[-1][1:],
                    })

                abandon_meta = yield from fs.file_query(cursor,directory_id,[rename_try])
                if not abandon_meta:
                    rename = rename_try
                    break
                elif abandon_meta[0]['status'] == 0:
                    yield from fs.file_delete(cursor,[abandon_meta[0]["id"]])
                    if abandon_meta[0]['type'] =='directory':
                        request.app.loop.create_task(fs.file_delete_async(request.app['pool'],[abandon_meta[0]["id"]]))
                    rename = rename_try
                    break

                index += 1

        yield from fs.file_modify(cursor,source_meta['id'],{
            "name": renames
        })

        if source_meta['type'] != 'directory':
            yield from fs.version_sync(cursor,source_meta['id'])

        yield from fs.file_modify(cursor,directory_id,{
            "modify": toolbox.time_str(now),
            "name": renames
        })
        
        yield from connect.commit()
        yield from cursor.close()
        connect.close()

        return toolbox.javaify(200,"success",{
            "name": rename,
            "extension": os.path.splitext(rename)[-1][1:],
        })
