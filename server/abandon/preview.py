import asyncio
import os
from . import toolbox, mask, fs
from aiohttp_session import get_session

@asyncio.coroutine
def route(request):

    session = yield from get_session(request)
    if 'uid' in session:
        uid = session['uid']
    else:
        uid = 4
        # return toolbox.javaify(403,"forbidden")

    query_parameters = request.rel_url.query
    
    path = query_parameters["path"] if "path" in query_parameters else ''

    if not path:
        return toolbox.javaify(400,"miss parameter")

    directory,name = os.path.split(path)

    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        yield from cursor.execute('''
            SELECT type, modify, md5, status FROM garage WHERE uid = %s AND directory = %s AND name = %s
        ''',(uid,directory,name))

        result = yield from cursor.fetchone()

        if not result or result[3] == 0 or result[0] == 'directory':
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        yield from cursor.close()
        connect.close()

        source = mask.generate(uid,result[2],os.path.splitext(name)[-1][1:])

        data = {
            "name": name,
            "type": result[0],
            "modify": toolbox.time_utc(result[1]),
            "preview": source,
            "download": source,
        }

        return toolbox.javaify(200,"ok",data)


