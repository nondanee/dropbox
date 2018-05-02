import asyncio
import datetime
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

    if request.content_type != "application/x-www-form-urlencoded":
        return toolbox.javaify(400,"wrong content type")

    data = yield from request.post()

    directory = data['dir'] if 'dir' in data else ''
    names = list(filter(None,list(set(data['name'].split('|'))))) if 'name' in data else ''
    
    if not directory or not names:
        return toolbox.javaify(400,"miss parameter")

    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        directory_id = yield from fs.directory_exists(cursor,uid,directory)

        if not directory_id:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"target error")

        file_meta = yield from fs.file_query(cursor,directory_id,names)

        if not file_meta:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        elif len(file_meta) != len(names):
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        file_ids = [str(item['id']) for item in file_meta if item['status'] == 1]

        if len(file_ids) != len(names):
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        now = datetime.datetime.now()

        yield from cursor.execute('''
            INSERT INTO share VALUES (%s,%s,%s,%s,%s)
        ''',(None,uid,directory_id,','.join(file_ids),toolbox.time_str(now)))
        yield from connect.commit()

        yield from cursor.execute('''
            SELECT LAST_INSERT_ID()
        ''')

        (bucket_id,) = yield from cursor.fetchone()
        mark = mask.encrypt(str(bucket_id).zfill(8))

        yield from cursor.close()
        connect.close()

        return toolbox.javaify(200,"success",{
            "mark": mark,
            "create": toolbox.time_utc(now)
        })
