import asyncio, aiohttp
import os, datetime, urllib
from . import toolbox, mask, oss
from aiohttp_session import get_session

@asyncio.coroutine
def route(request):

    # TODO 
    # request.headers["Referer"]

    session = yield from get_session(request)
    if 'uid' in session:
        uid = session['uid']
    else:
        uid = 4
        # return toolbox.javaify(403,"forbidden")

    query_parameters = request.rel_url.query
    
    action = request.match_info["action"] if 'action' in request.match_info else 'source'
    filename = request.match_info["filename"] if 'filename' in request.match_info else ''

    param = ''
    tag = ''

    if 'param' in request.match_info:
        param = request.match_info["param"]
    elif 'source' in query_parameters:
        param = query_parameters["source"]
    elif 'tag' in query_parameters:
        tag = query_parameters["tag"]
    else:
        return toolbox.javaify(400,"bad request")
    
    if param:
        
        uid,md5,extension = mask.verify(uid,param)

        if not md5:
            return toolbox.javaify(403,"forbidden")

        extension = extension.lower()

        office_file = {'xls':'','xlsx':'','ppt':'','pptx':'','doc':'','docx':''}
        photo_file = {'jpg':'','jpeg':'','gif':'','png':'','bmp':''}

        if action == 'source':
            target_url = oss.dynamic_url(uid,md5)

        elif action == 'thumbnail' and extension in photo_file:
            if request.match_info["type"] == 'list':
                target_url = oss.dynamic_url(uid,md5,'thumbnail32')
            elif request.match_info["type"] == 'grid':
                target_url = oss.dynamic_url(uid,md5,'thumbnail256')

        elif action == 'preview' and extension in photo_file:
            target_url = oss.dynamic_url(uid,md5)

        elif action == 'preview' and extension in office_file:

            release_url = 'https://nondanee.tk/release/{}/{}.{}'.format(str(uid).zfill(8),md5,extension)
            target_url = 'https://view.officeapps.live.com/op/view.aspx?src={}'.format(urllib.parse.quote_plus(release_url))
            
        else:
            return toolbox.javaify(400,"bad request")


    elif tag:

        tag = mask.decrypt(tag)

        if not tag:
            return toolbox.javaify(400,"bad request")

        target_url = oss.bucket_url(tag)


    # https://gist.github.com/jbn/fc90e3ddbc5c60c698d07b3df30004c8

    session = aiohttp.ClientSession(headers={"Accept-Encoding": "identity"})

    response = yield from session.get(target_url)
    headers = dict(response.headers)
    
    if filename:
        headers['Content-Disposition'] = '''attachment; filename="{}"; filename*=utf-8' '{}'''.format(filename,urllib.parse.quote(filename))

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