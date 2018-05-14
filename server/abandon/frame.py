import asyncio, aiohttp
import os, datetime, urllib
from . import toolbox, mask, oss, html
from aiohttp_session import get_session

@asyncio.coroutine
def route(request):

    # TODO 
    # request.headers["Referer"]

    session = yield from get_session(request)
    if 'uid' in session:
        uid = session['uid']
    else:
        # uid = 4
        return toolbox.javaify(403,"forbidden")

    action = request.match_info["action"]
    filename = request.match_info["filename"]

    query_parameters = request.rel_url.query

    source = query_parameters["source"] if 'source' in query_parameters else ''
    
    if not source:
        return toolbox.javaify(400,"bad request")

    oid,md5 = mask.verify(uid,source)
    release = mask.generate(oid,md5,0)

    if action == 'pdf':

        text = html.pdf_viewer.format(
            source_url = '/source/{}?source={}'.format(filename,source)
        )

        return aiohttp.web.Response(
            text = text,
            content_type = 'text/html',
            charset = 'utf-8'
        )

    if action == 'office':

        release_url = '{}release/{}?source={}'.format(os.environ["HEROKU_URL"],filename,release)
        target_url = 'https://view.officeapps.live.com/op/view.aspx?src={}'.format(urllib.parse.quote_plus(release_url))

        session = aiohttp.ClientSession(headers={"Accept-Encoding": "identity"})

        response = yield from session.get(target_url)

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