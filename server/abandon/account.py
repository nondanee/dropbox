import asyncio
from . import toolbox
from aiohttp import web
from aiohttp_session import get_session

@asyncio.coroutine
def route(request):

    session = yield from get_session(request)
    if 'uid' in session:
        uid = session['uid']
    else:
        # uid = 4
        return toolbox.javaify(403,"forbidden")

    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        yield from cursor.execute('''
            SELECT SUM(garage.size),user.name from garage,user WHERE garage.uid = %s
            AND user.id = garage.uid
        ''',(uid))

        result = yield from cursor.fetchone()

        if not result:
            return toolbox.javaify(404,"not found")
        else:
            return toolbox.javaify(200,"ok",{
                "name": result[1],
                "usage": int(result[0])
            })