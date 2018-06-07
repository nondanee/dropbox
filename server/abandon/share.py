import asyncio
import datetime, os
from . import toolbox, mask, fs
from aiohttp import web
from aiohttp_session import get_session

@asyncio.coroutine
def route(request):

    session = yield from get_session(request)
    if 'uid' in session:
        uid = session['uid']
    else:
        return toolbox.javaify(403,"forbidden")

    query_parameters = request.rel_url.query
    path = query_parameters["path"] if "path" in query_parameters else ''

    if not path:
        return toolbox.javaify(400,"miss parameter")

    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        file_check = yield from fs.file_exists(cursor,uid,path)

        if not file_check:
            return toolbox.javaify(400,"bad request")

        yield from cursor.execute('''
            SELECT id FROM share WHERE gid = %s
        ''',(file_check['id']))

        share_check = yield from cursor.fetchone()

        if request.method == 'GET':

            yield from cursor.close()
            connect.close()

            if share_check:
                mark = encrypt(str(share_check[0]).zfill(8))
                return toolbox.javaify(200,"ok",{"mark": mark})
            else:
                return toolbox.javaify(200,"empty")

        elif not share_check and request.method == 'POST':
            yield from cursor.execute('''
                INSERT INTO share VALUES(null,%s,now())
            ''',(file_check['id']))
            
            yield from cursor.execute('''
                SELECT LAST_INSERT_ID()
            ''')

            last_insert = yield from cursor.fetchone()
            sid = last_insert[0]
            mark = encrypt(str(sid).zfill(8))

            yield from connect.commit()
            yield from cursor.close()
            connect.close()

            return toolbox.javaify(200,"success",{"mark": mark})

        elif share_check and request.method == 'DELETE':

            yield from cursor.execute('''
                DELETE FROM share WHERE id = %s
            ''',(share_check[0]))

            yield from connect.commit()
            yield from cursor.close()
            connect.close()

            return toolbox.javaify(200,"success")

        else:

            yield from cursor.close()
            connect.close()

            return toolbox.javaify(400,"bad request")

        
