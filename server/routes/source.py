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
        uid = 1
        # return toolbox.javaify(403,"forbidden")

    query_parameters = request.rel_url.query
    
    action = request.match_info["action"] if 'action' in request.match_info else 'source'
 
    filename = request.match_info["filename"] if 'filename' in request.match_info else ''

    if 'param' in request.match_info:
        param = request.match_info["param"]
    elif 'source' in query_parameters:
        param = query_parameters["source"]
    else:
        return toolbox.javaify(400,"bad request")
    
    uid,md5,extension = mask.verify(uid,param)

    if not md5:
        return toolbox.javaify(403,"forbidden")

    if "verify" in query_parameters:
        return toolbox.javaify(200,"ok",md5)

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
        # target_url = 'https://docs.google.com/viewer?url={}'.format(release_url)
        
    else:
        return toolbox.javaify(400,"bad request")


    # https://gist.github.com/jbn/fc90e3ddbc5c60c698d07b3df30004c8

    session = aiohttp.ClientSession(headers={"Accept-Encoding": "identity"})
        
    response = yield from session.get(target_url)
    headers = dict(response.headers)
    if filename:
        headers['Content-Disposition'] = '''inline; filename="{}"; filename*=utf-8' '{}'''.format(filename,urllib.parse.quote(filename))

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