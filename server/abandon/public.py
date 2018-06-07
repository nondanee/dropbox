import asyncio
import datetime, os
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

    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        yield from cursor.execute('''
            SELECT share.id, share.start, garage.directory, garage.name, garage.type
            FROM share,garage WHERE uid = %s AND share.gid = garage.id
        ''',(uid))

        result = yield from cursor.fetchall()
        yield from cursor.close()
        connect.close()

        return toolbox.javaify(200,"ok")