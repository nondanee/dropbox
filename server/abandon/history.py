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
            SELECT id, size, md5 FROM garage WHERE uid = %s AND directory = %s AND name = %s
        ''',(uid,directory,name))

        result = yield from cursor.fetchone()

        if not result:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        yield from cursor.execute('''
            SELECT occur, action, original, modify from operation WHERE gid = %s ORDER BY id
        ''',(result[0],))

        data = yield from cursor.fetchall()

        yield from cursor.close()
        connect.close()

        for line in data:
            pass

