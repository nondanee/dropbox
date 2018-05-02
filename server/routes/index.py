import asyncio
from . import toolbox
from aiohttp import web
from aiohttp_session import get_session

@asyncio.coroutine
def route(request):

    return web.Response(
        text = "hello world",
        content_type = 'text/html',
        charset = 'utf-8'
    )
