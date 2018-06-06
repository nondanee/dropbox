import asyncio, aiohttp
import os, datetime, urllib
from . import toolbox, mask, oss
from aiohttp_session import get_session

@asyncio.coroutine
def route(request):

    # TODO 
    # request.headers["Referer"]

    session = yield from get_session(request)
    
    uid = session['uid'] if 'uid' in session else ''

    action = request.match_info["action"]
    filename = request.match_info["filename"]

    query_parameters = request.rel_url.query

    size = query_parameters["size"] if 'size' in query_parameters else ''
    source = query_parameters["source"] if 'source' in query_parameters else ''
    tag = query_parameters["tag"] if 'tag' in query_parameters else ''
    
    
    if source:

        if action in {'source':'','download':'','thumbnail':''}:
        
            oid,md5 = mask.verify(uid,source)

            if not md5:
                return toolbox.javaify(403,"forbidden")

            if action == 'source' or action == 'download':
                target_url = oss.dynamic_url(oid,md5)

            elif action == 'thumbnail':
                if size == 'large':
                    target_url = oss.dynamic_url(oid,md5,'thumbnail256')
                else:
                    target_url = oss.dynamic_url(oid,md5,'thumbnail32')

        elif action in {'release':''}:

            oid,md5 = mask.verify(0,source)
            target_url = oss.dynamic_url(oid,md5)
            
        else:
            return toolbox.javaify(400,"bad request")


    elif tag:

        tag = mask.decrypt(tag)

        if not tag or action != 'download':
            return toolbox.javaify(400,"bad request")

        target_url = oss.bucket_url(tag)

    else:
        return toolbox.javaify(400,"bad request")


    # https://gist.github.com/jbn/fc90e3ddbc5c60c698d07b3df30004c8

    headers = {'Accept-Encoding': 'identity'}
    if 'Range' in request.headers: headers['Range'] = request.headers['Range']
    session = aiohttp.ClientSession(headers = headers)

    try:
        response = yield from session.get(target_url,timeout = 5)
        headers = dict(response.headers)
    
        disposition = 'attachment' if action == 'download' else 'inline'
        headers['Content-Disposition'] = '''{}; filename="{}"; filename*=utf-8' '{}'''.format(disposition,filename,urllib.parse.quote(filename))

    except:
        yield from session.close()
        return toolbox.javaify(503,"service unavailable")

    else:
        stream = aiohttp.web.StreamResponse( 
        status = response.status, 
        headers = headers
    )

    yield from stream.prepare(request)

    while True:
        chunk = yield from response.content.read(1024)
        if not chunk:
            break
        yield from stream.write(chunk)

    yield from session.close()

    return stream