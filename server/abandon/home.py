import asyncio
from . import html
from aiohttp import web
from aiohttp_session import get_session

@asyncio.coroutine
def route(request):

    session = yield from get_session(request)
    
    uid = session['uid'] if 'uid' in session else ''

    if uid:
        return web.Response(
            text = html.home_page,
            content_type = 'text/html',
            charset = 'utf-8'
        )
    else:
        return web.HTTPFound('/')