import asyncio
from . import html
from aiohttp import web
from aiohttp_session import get_session

@asyncio.coroutine
def route(request):

    session = yield from get_session(request)
    
    uid = session['uid'] if 'uid' in session else ''
    remember = session['remember'] if 'remember' in session else ''

    if uid:

        if remember:
            session['uid'] = uid
            session.max_age = request.app["session_expire"]

        return web.Response(
            text = str(remember),
            content_type = 'text/html',
            charset = 'utf-8'
        )

    else:

        return web.Response(
            text = html.sign_page,
            content_type = 'text/html',
            charset = 'utf-8'
        )
