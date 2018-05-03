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

    if not directory or not name:
        return toolbox.javaify(400,"miss parameter")

    if fs.name_illegal(name):
        return toolbox.javaify(400,"name illegal")


    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        directory_id = yield from fs.directory_exists(cursor,uid,directory)

        if not directory_id:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"target error")

        now = datetime.datetime.now()

        file_meta = yield from fs.file_query(cursor,directory_id,[name])        

        if file_meta and file_meta[0]["status"] == 1:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"file exists")

        elif file_meta and file_meta[0]["status"] == 0:

            yield from fs.file_delete(cursor,[file_meta[0]["id"]])

            if file_meta[0]['type'] =='directory':
                request.app.loop.create_task(fs.file_delete_async(request.app['pool'],[file_meta[0]["id"]]))

        yield from fs.file_create(cursor,{
            "directory": directory_id,
            "name": name,
            "type": "directory",
            "modify": toolbox.time_str(now),
            "md5": "",
            "size": 0

        })        

        yield from connect.commit()  
        yield from cursor.close()
        connect.close()

        return toolbox.javaify(200,"success",{
            "name": name,
            "type": "directory",
            "extension": "",
            "modify": toolbox.time_utc(now),
            "owner": "self",
            "size": None,
        })