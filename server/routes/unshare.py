import asyncio
from . import toolbox, mask
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

    mark = data['mark'] if 'mark' in data else ''

    if not mark:
        return toolbox.javaify(400,"miss parameter")

    bucket_id = mask.decrypt(bucket_mark)
    if not bucket_id:
        return toolbox.javaify(400,"bad request")

    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        bucket_check = yield from cursor.execute('''
            SELECT id FROM share WHERE id = %s AND uid = %s
        ''',(bucket_id,uid))

        if not bucket_check:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        yield from cursor.execute('''
            DELETE FROM share WHERE id = %s
        ''',(bucket_id))
        yield from connect.commit()

        yield from cursor.close()
        connect.close()

        return toolbox.javaify(200,"success")