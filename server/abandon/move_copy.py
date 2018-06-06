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
        # uid = 4
        return toolbox.javaify(403,"forbidden")

    if request.content_type != "application/x-www-form-urlencoded":
        return toolbox.javaify(400,"wrong content type")

    data = yield from request.post()
    action = request.match_info["action"]

    src = data['src'] if 'src' in data else ''
    dst = data['dst'] if 'dst' in data else ''
    names = list(filter(None,list(set(data['name'].split('|'))))) if 'name' in data else ''

    if not src or not dst or not names:
        return toolbox.javaify(400,"miss parameter")

    for name in names: # directory inner check
        if fs.path_involve(os.path.join(src,name),dst):
            return toolbox.javaify(400,"with loop")

    if src == dst and action == 'move':
        return toolbox.javaify(400,"already exists")


    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        src_directory_check = yield from fs.directory_exists(cursor,uid,src)
        
        if not src_directory_check or src_directory_check['status'] == 0:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"source error")

        dst_directory_check = yield from fs.directory_exists(cursor,uid,dst)
        
        if not dst_directory_check or dst_directory_check['status'] == 0:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"destination error")

        src_file_check = yield from fs.file_query(cursor,uid,src,names)

        if not src_file_check:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        elif len(src_file_check) != len(names):
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        names_indeed = {item['name']:item['type'] for item in src_file_check if item['status'] == 1}

        if len(names_indeed) != len(names):
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        dst_file_check = yield from fs.file_query(cursor,uid,dst,names)

        conflict = {item['name']:item['type'] for item in dst_file_check if item['status'] == 1}
        abandon = {item['name']:item['type'] for item in dst_file_check if item['status'] == 0}
        special = {}


        for name in abandon:

            if abandon[name] == 'directory':
                yield from fs.directory_delete(cursor,uid,os.path.join(dst,name))
            else:
                yield from fs.file_delete(cursor,uid,os.path.join(dst,name))

        for name in conflict:

            serial = 1
            
            while True:
                rename = " ({})".format(serial).join(os.path.splitext(name))

                file_check = yield from fs.file_exists(cursor,uid,os.path.join(dst,rename))
                
                if not file_check:
                    break

                elif file_check['status'] == 0:

                    if file_check['type'] == 'directory':
                        yield from fs.directory_delete(cursor,uid,os.path.join(dst,rename))
                    else:
                        yield from fs.file_delete(cursor,uid,os.path.join(dst,rename))

                    break

                serial += 1

            special[name] = rename

        for name in names_indeed:

            rename = '' if name not in special else special[name]

            if names_indeed[name] == 'directory' and action == 'move':
                yield from fs.directory_move(cursor,uid,src,dst,name,rename)
            elif names_indeed[name] != 'directory' and action == 'move':
                yield from fs.file_move(cursor,uid,src,dst,name,rename)
            elif names_indeed[name] == 'directory' and action == 'copy':
                yield from fs.directory_copy(cursor,uid,src,dst,name,rename)
            elif names_indeed[name] != 'directory' and action == 'copy':
                yield from fs.file_copy(cursor,uid,src,dst,name,rename)

        yield from connect.commit()
        yield from cursor.close()
        connect.close()

        return toolbox.javaify(200,"success")
