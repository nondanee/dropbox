import asyncio, aiohttp
import os, datetime, urllib
from . import toolbox, oss

@asyncio.coroutine
def route(request):
    
    uid = request.match_info["uid"]
    md5 = request.match_info["md5"]
    extension = request.match_info["extension"]

    user_agent = request.headers['User-Agent']

    if user_agent.find('Google AppsViewer') == -1 and user_agent.find('MSIE 11') == -1:
        return toolbox.javaify(403,'forbidden')

    resource_url = oss.dynamic_url(uid,md5)


    session = aiohttp.ClientSession(headers={"Accept-Encoding": "identity"})
        
    response = yield from session.get(resource_url)

    # headers = dict(response.headers)
    # headers["Content-Disposition"] = '''attachment; filename="{md5}.{suffix}"; filename*=utf-8' '{md5}.{suffix}'''.format(md5=md5,suffix=suffix)

    stream = aiohttp.web.StreamResponse( 
        status = response.status, 
        headers = response.headers
    )

    yield from stream.prepare(request)

    while True:
        chunk = yield from response.content.read(1024)
        if not chunk:
            break
        yield from stream.write(chunk)

    yield from session.close()

    return stream        