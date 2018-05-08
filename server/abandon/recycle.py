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

    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        yield from cursor.execute('''
            SELECT directory, name, modify FROM garage WHERE uid = %s AND type = 'directory' AND status = 0
        ''',(uid,))
        directories = yield from cursor.fetchall()

        param = [os.path.join(line[0],line[1]) for line in directories]

        files = []

        if param:

            yield from cursor.execute('''
                SELECT directory, name, type, modify FROM garage 
                WHERE uid = %%s AND type != 'directory' AND status = 0 AND directory NOT IN (%s)
            '''%(', '.join(['%s'] * (len(param)))),tuple([uid,]+param))
            files = yield from cursor.fetchall()

        else:

            yield from cursor.execute('''
                SELECT directory, name, type, modify FROM garage 
                WHERE uid = %s AND status = 0
            '''%(uid,))
            files = yield from cursor.fetchall()

        yield from cursor.close()
        connect.close()

        data = []

        for line in directories:
            
            data.append({
                "name": line[1],
                "type": 'directory',
                "directory": line[0],
                "modify": toolbox.time_utc(line[2]),
            })

        for line in files:

            data.append({
                "name": line[1],
                "type": line[2],
                "directory": line[0],
                "modify": toolbox.time_utc(line[3]),
            })

        return toolbox.javaify(200,'ok',data)