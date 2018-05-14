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

    directory = data['dir'] if 'dir' in data else ''
    name = data['name'] if 'name' in data else ''

    if not directory or not name:
        return toolbox.javaify(400,"miss parameter")

    if fs.name_illegal(name):
        return toolbox.javaify(400,"name illegal")

    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        directory_check = yield from fs.directory_exists(cursor,uid,directory)
        
        if not directory_check or directory_check['status'] == 0:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"target error")


        file_check = yield from fs.file_exists(cursor,uid,os.path.join(directory,name))

        if file_check and file_check["status"] == 0:
            
            if file_check["type"] == "directory":
                yield from fs.directory_delete(cursor,uid,os.path.join(directory,name))
            else:
                yield from fs.file_delete(cursor,uid,os.path.join(directory,name))
            
            file_check = None

        if not file_check:

            yield from fs.file_create(cursor,[uid,directory,name,'directory',0,'',1])

        elif file_check['type'] != "directory":
            
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"file exists")

        else:
            
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"already exists")

        yield from connect.commit()
        yield from cursor.close()
        connect.close()

        now = datetime.datetime.now()

        return toolbox.javaify(200,"success",{
            "name": name,
            "type": "directory",
            "extension": "",
            "modify": toolbox.time_utc(now),
            "owner": "self",
            "size": None,
            "status": 1,
            "source": None
        })