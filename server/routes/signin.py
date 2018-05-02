import asyncio
import hashlib
from . import toolbox
from aiohttp import web
from aiohttp_session import get_session

@asyncio.coroutine
def route(request):

    session = yield from get_session(request)

    if request.content_type != "application/x-www-form-urlencoded":
        return toolbox.javaify(400,"wrong content type")

    data = yield from request.post()

    if 'email' in data:
        email = data['email'] 
    else:
        return toolbox.javaify(400,"miss parameter")

    if 'password' in data:
        password = data['password']
        hash_password = hashlib.sha1(password.encode("utf-8")).hexdigest()
    else:
        return toolbox.javaify(400,"miss parameter")

    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()
        
        yield from cursor.execute('''SELECT id FROM user WHERE email = %s AND password = %s AND status = 1''',(email,hash_password))
        check = yield from cursor.fetchone()
        
        yield from cursor.close()
        connect.close()

        if check:
            session["uid"] = check[0]
            return toolbox.javaify(200,"ok")
        else:
            session.clear()
            return toolbox.javaify(403,"forbidden")