import asyncio
import os
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

    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()
        
        yield from cursor.execute('''
            SELECT id, item, start FROM share WHERE uid = %s
        ''',(uid))

        buckets = yield from cursor.fetchall()

        yield from cursor.close()
        connect.close()

        file_ids = []

        for item in buckets:

            file_ids += item[1].split(',')

        file_ids = set(file_ids)

        yield from cursor.execute('''
            SELECT id, name, type, modify, size, md5 FROM repository 
            WHERE status = 1 AND id in (%s)
        '''%(', '.join(['%s'] * (len(file_ids)))),tuple(file_ids))

        out = yield from cursor.fetchall()
        query = {item[0]:{'name':item[1],'type':item[2],'modify':item[3],'size':item[4],'md5':item[5]} for item in out}

        data = []

        for item in buckets:
            
            file_ids = item[1].split(',')
            files = []

            for file_id in file_ids:
                meta = query[file_id]
                meta['modify'] = toolbox.time_utc(meta['modify'])
                meta['size'] = None if meta['size'] == 0 else meta['size']
                meta['source'] = mask.generate(uid,meta['name'],os.path.splitext(meta['name'])[-1][1:]) if meta['type'] != 'directory' else ''
                files.append(meta)

            data.append({
                "mark": mask.encrypt(str(line[0]).zfill(8)),
                "create": line[2],
                "files": files,
            })

        return toolbox.javaify(200,"ok",data)
