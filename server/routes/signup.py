import asyncio
import hashlib, datetime
from . import toolbox
from aiohttp import web
# from aiohttp_session import get_session

@asyncio.coroutine
def route(request):

    # session = yield from get_session(request)

    if request.content_type != "application/x-www-form-urlencoded":
        return toolbox.javaify(400,"wrong content type")

    data = yield from request.post()

    if 'email' in data:
        email = data['email'] 
    else:
        return toolbox.javaify(400,"miss parameter")

    if 'name' in data:
        name = data['name'] 
    else:
        return toolbox.javaify(400,"miss parameter")

    if 'password' in data:
        password = data['password']
        hash_password = hashlib.sha1(password.encode("utf-8")).hexdigest()
    else:
        return toolbox.javaify(400,"miss parameter")

    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()
        
        try:
            yield from cursor.execute('''INSERT INTO user VALUES (%s,%s,%s,%s,%s)''',(None,email,hash_password,name,1))
            yield from connect.commit()

            yield from cursor.execute('''SELECT LAST_INSERT_ID()''')
            (uid,) = yield from cursor.fetchone()
            now = datetime.datetime.now()

            yield from cursor.execute('''INSERT INTO repository VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s)''',(None,0,uid,"directory",toolbox.time_str(now),0,"",0,1))
            yield from connect.commit()
            
            yield from cursor.close()
            connect.close()

        except Exception as error:
            yield from cursor.close()
            connect.close()
            if error.args[1].find("email") != -1:    
                return toolbox.javaify(400,"duplication")
            else:
                return toolbox.javaify(400,"bad request")

        else:
            return toolbox.javaify(200,"ok")
