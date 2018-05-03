import asyncio, hashlib
from aiohttp import web, ClientSession
from multidict import MultiDict
import aiohttp, random
import json
from . import oss

@asyncio.coroutine
def route(request):

    # data = yield from request.read()

    data = yield from request.post()
    print(data)

    print('trigger')
    print(data['key'])
    print(data['token'])

    # for key in data:
    #     mp3 = data[key]

    # filename = mp3.filename
    # mp3_file = mp3.file
    # content = mp3_file.read()

    mp3_file = data['file'].file

    content = mp3_file.read()

    f = open('test.mp3','wb')
    f.write(content)
    f.close()

    return web.Response(body="ok")

@asyncio.coroutine
def route2(request):

    # data  = yield from request.read()
    # print(data)

    uid = 1

    reader = yield from request.multipart()

    part = yield from reader.next()
    
    session = ClientSession()
    boundary = '----------%s' % ''.join(random.sample('0123456789abcdef', 15)) 
    content_type = 'multipart/form-data; boundary={}'.format(boundary)
    response = yield from session.post('http://up-z2.qiniu.com',data=proxy(uid,part,boundary),headers={'Content-Type':content_type})
    json_back = yield from response.text()
    json_back = json.loads(json_back)
    file_type = json_back["type"]
    size = json_back["size"]
    md5 = json_back["key"].split("/")[-1]

    print(file_type,md5,size)

    yield from session.close()

    return web.Response(body='ok')


async def proxy(uid,part,boundary):
    CRLF = '\r\n'
    content_disposition = 'Content-Disposition: form-data; name="file"; filename="file"'
    content_type = 'Content-Type: ' + part.headers['Content-Type']
    yield CRLF.join(['--' + boundary,content_disposition,content_type,'','']).encode()
    md5 = hashlib.md5()

    while True:
        chunk = await part.read_chunk()
        if not chunk:
            break
        md5.update(chunk)
        yield chunk

    key = '{}/{}'.format(str(uid).zfill(8),md5.hexdigest())
    token = oss.generate_token(key)
    yield CRLF.join(['','--'+boundary,'Content-Disposition: form-data; name="key"','',key]).encode()
    yield CRLF.join(['','--'+boundary,'Content-Disposition: form-data; name="token"','',token]).encode()
    yield CRLF.join(['','--'+boundary+'--','']).encode()


# from async_generator import async_generator, yield_
# @async_generator
# async def pipe(part):
#     while True:
#         chunk = await part.read_chunk()
#         if not chunk:
#             break
#         await yield_(chunk)