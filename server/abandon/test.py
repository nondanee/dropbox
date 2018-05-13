import asyncio, hashlib
from aiohttp import web, ClientSession
from multidict import MultiDict
import aiohttp, random
import json
from . import oss, toolbox

@asyncio.coroutine
def route(request):

    # data = yield from request.read()

    data = yield from request.post()
    print(data)


    # for key in data:
    #     mp3 = data[key]

    # filename = mp3.filename
    # mp3_file = mp3.file
    # content = mp3_file.read()

    return toolbox.javaify(200,'???',)