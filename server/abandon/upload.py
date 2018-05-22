import asyncio
import os, re, uuid, hashlib, datetime, json
from . import toolbox, oss, mask, fs
from aiohttp import ClientSession
from aiohttp_session import get_session

@asyncio.coroutine
def route(request):

    session = yield from get_session(request)
    if 'uid' in session:
        uid = session['uid']
    else:
        # uid = 4
        return toolbox.javaify(403,"forbidden")

    if request.content_type != "multipart/form-data":
        return toolbox.javaify(400,"content type error")

    query_parameters = request.rel_url.query
    if "dir" in query_parameters:
        directory = query_parameters["dir"]
    else:
        return toolbox.javaify(400,"miss parameter")

    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()
        
        directory_check = yield from fs.directory_exists(cursor,uid,directory)

        if not directory_check:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"target error")
        elif directory_check['status'] == 0:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"target error")

        try:
            reader = yield from request.multipart()
            part = yield from reader.next()
        except Exception as e:
            print(e)
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        if part is None:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        try:
            file_name = re.search(r'filename="([^"]+)"',part.headers["Content-Disposition"]).group(1)
        except:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        if fs.name_illegal(file_name):
            return toolbox.javaify(400,"name illegal")

        file_check = yield from fs.file_exists(cursor,uid,os.path.join(directory,file_name))

        if file_check and file_check["type"] == "directory" and file_check["status"] == 1:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"directory exists")

        yield from cursor.close()
        connect.close()


    session = ClientSession()
    boundary = '----------{}'.format(uuid.uuid4().hex)
    content_type = 'multipart/form-data; boundary={}'.format(boundary)
    try:
        response = yield from session.post('http://up-z2.qiniu.com',data=rewrite(uid,part,boundary),headers={'Content-Type':content_type})
        json_back = yield from response.text()
        json_back = json.loads(json_back)
        file_type = json_back["type"]
        size = json_back["size"]
        md5 = json_back["key"].split("/")[-1]
    except Exception as error:
        print(error)
        yield from session.close()
        return toolbox.javaify(500,"something wrong")
    else:
        yield from session.close()


    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        file_check = yield from fs.file_exists(cursor,uid,os.path.join(directory,file_name))

        if file_check and file_check["type"] == "directory" and file_check["status"] == 1:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"directory exists")
        
        elif file_check and file_check["type"] == "directory" and file_check["status"] == 0:
            yield from fs.directory_delete(cursor,uid,os.path.join(directory,file_name))

        if not file_check:
            yield from fs.file_create(cursor,[uid,directory,file_name,file_type,size,md5,1])

        else:
            yield from fs.file_rewrite(cursor,uid,os.path.join(directory,file_name),[file_type,size,md5])
        
        yield from connect.commit()
        yield from cursor.close()
        connect.close()

        now = datetime.datetime.now()
        file_extension = os.path.splitext(file_name)[-1][1:]

        return toolbox.javaify(200,"success",{
            "name": file_name,
            "type": file_type,
            "extension": file_extension,
            "modify": toolbox.time_utc(now),
            "owner": "self",
            "size": size,
            "status": 1,
            "source": mask.generate(uid,md5)
        })


# python3.6 only
async def rewrite(uid,part,boundary):
    CRLF = '\r\n'
    content_disposition = 'Content-Disposition: form-data; name="file"; filename="file"'
    content_type = 'Content-Type: {}'.format(part.headers['Content-Type'])
    yield CRLF.join(['--' + boundary,content_disposition,content_type,'','']).encode()
    md5 = hashlib.md5()

    while True:
        chunk = await part.read_chunk()
        if not chunk:
            break
        md5.update(chunk)
        yield chunk

    key = '{}/{}'.format(str(uid).zfill(8),md5.hexdigest())
    token = oss.upload_token(key)

    yield CRLF.join(['','--'+boundary,'Content-Disposition: form-data; name="key"','',key]).encode()
    yield CRLF.join(['','--'+boundary,'Content-Disposition: form-data; name="token"','',token]).encode()
    yield CRLF.join(['','--'+boundary+'--','']).encode()