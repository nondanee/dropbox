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
        # uid = 4
        return toolbox.javaify(403,"forbidden")

    query_parameters = request.rel_url.query
    
    path = query_parameters["path"] if "path" in query_parameters else ''
    version = mask.decrypt(query_parameters["version"]) if "version" in query_parameters else ''

    if not path:
        return toolbox.javaify(400,"miss parameter")

    directory,name = os.path.split(path)

    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        yield from cursor.execute('''
            SELECT id, type, modify, size, md5, status FROM garage WHERE uid = %s AND directory = %s AND name = %s
        ''',(uid,directory,name))

        current = yield from cursor.fetchone()

        if not current or current[0] == 'directory':
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        mime = current[1]
        modify = current[2]
        size = current[3]
        md5 = current[4]
        history = []

        if version:
            yield from cursor.execute('''
                SELECT occur, action, modify FROM operation WHERE id = %s AND gid = %s AND action IN (0,1)
            ''',(version,current[0]))

            history = yield from cursor.fetchone()

            if not history:
                yield from cursor.close()
                connect.close()
                return toolbox.javaify(400,"bad request")

        yield from cursor.close()
        connect.close()

        if history:
            mime, size, md5 = history[2].split('|')
            modify = history[0]

        source = mask.generate(uid,md5)

        data = {
            "name": name,
            "type": mime,
            "modify": toolbox.time_utc(modify),
            "size": size,
            "source": source
        }

        return toolbox.javaify(200,"ok",data)


