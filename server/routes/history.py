import asyncio
import os
from . import toolbox, mask, fs
from aiohttp import web
from aiohttp_session import get_session

@asyncio.coroutine
def route(request):

    session = yield from get_session(request)
    if 'uid' in session:
        uid = session['uid']
    else:
        return toolbox.javaify(403,"forbidden")

    query_parameters = request.rel_url.query
    
    path = query_parameters["path"] if "path" in query_parameters else ''
    
    if not path:
        return toolbox.javaify(400,"miss parameter")

    (directory,name) = os.path.split(path)

    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        directory_id = yield from fs.directory_exists(cursor,uid,directory)

        if not directory_id:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(404,"no directory")

        file_meta = yield from fs.file_query(cursor,directory_id,[name])

        if not file_meta or file_meta[0]['type'] == 'directory':
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(404,"no file")

        yield from cursor.execute('''
            SELECT name, modify, size, md5 FROM history WHERE id = %s ORDER BY version DESC
        ''',(file_meta[0]['id']))

        out = yield from cursor.fetchall()

        yield from cursor.close()
        connect.close()

        data = []
        for line in out:
            if line[0] == "":
                continue
            data.append({
                "name": line[0],
                "extension": os.path.splitext(line[0])[-1][1:],
                "modify": toolbox.time_utc(line[1]),
                "size": line[2],
                "icon": "icon",
                "source": mask.generate(uid,line[3],os.path.splitext(line[0])[-1][1:])
            })

        return toolbox.javaify(200,"ok",data)
