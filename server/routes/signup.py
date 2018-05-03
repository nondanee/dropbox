import asyncio
import hashlib, datetime
from . import toolbox
# from aiohttp_session import get_session

@asyncio.coroutine
def route(request):

    # session = yield from get_session(request)

    if request.content_type != "application/x-www-form-urlencoded":
        return toolbox.javaify(400,"wrong content type")

    data = yield from request.post()

    email = data['email'] if 'email' in data else ''   
    name = data['name'] if 'name' in data else ''    
    password = data['password'] if 'password' in data else ''
    
    if not email or not name:
        return toolbox.javaify(400,"miss parameter")

    hash_password = hashlib.sha1(password.encode("utf-8")).hexdigest()

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
