import asyncio
import datetime, os
from . import toolbox, mask
from aiohttp import web
from aiohttp_session import get_session

@asyncio.coroutine
def route(request):

    session = yield from get_session(request)
    if 'uid' in session:
        uid = session['uid']
    else:
        return toolbox.javaify(403,"forbidden")

    data = yield from request.post()

    if 'dir' in data:
        target_dir = data['dir']
    else:
        return toolbox.javaify(400,"miss parameter")

    if 'name' in data:
        names = list(filter(None,list(set(data['name'].split('|')))))
        if len(names) == 0:
            return toolbox.javaify(400,"miss parameter")
    else:
        return toolbox.javaify(400,"miss parameter")

    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        yield from cursor.execute('''
            SELECT id FROM repository WHERE uid = %%s AND directory = %%s AND status = 1 AND name in (%s)
        '''%(','.join(['%s'] * (len(names)))),tuple([uid,target_dir]+names))
        source_check = yield from cursor.fetchall()

        if not source_check:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        elif len(source_check) != len(names):
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        items = [str(item[0]) for item in source_check]

        now = datetime.datetime.now()

        yield from cursor.execute('''
            INSERT INTO share VALUES (%s,%s,%s,%s,%s)
        ''',(None,uid,target_dir,','.join(items),toolbox.time_str(now)))
        yield from connect.commit()

        yield from cursor.execute('''
            SELECT LAST_INSERT_ID()
        ''')
        last_insert = yield from cursor.fetchone()
        bucket_id = last_insert[0]
        bucket_mark = mask.encrypt(str(bucket_id).zfill(8))

        yield from cursor.close()
        connect.close()

        return toolbox.javaify(200,"success",{
            "bucket_mark": bucket_mark,
            "create": toolbox.time_utc(now)
        })
