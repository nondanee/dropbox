import asyncio
import os
from . import toolbox, mask
from aiohttp import web

@asyncio.coroutine
def route(request):

    bucket_mark = request.match_info["param"]
    bucket_id = mask.decrypt(bucket_mark)

    if not bucket_id:
        return toolbox.javaify(404,"not found")

    # TO DO
    return toolbox.javaify(200,"ok")
    # HTML PAGE