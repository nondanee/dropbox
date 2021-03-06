import asyncio
import os
from . import toolbox, mask, fs
from aiohttp_session import get_session

@asyncio.coroutine
def route(request):

    # TODO 
    # request.headers["Referer"]

    session = yield from get_session(request)
    if 'uid' in session:
        uid = session['uid']
    else:
        uid = 1
        # return toolbox.javaify(403,"forbidden")

    query_parameters = request.rel_url.query
    
    directory = query_parameters["dir"] if "dir" in query_parameters else ''
    deleted = query_parameters["del"] if "del" in query_parameters else ''

    if not directory:
        return toolbox.javaify(400,"miss parameter")

    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        directory_id = yield from fs.directory_exists(cursor,uid,directory)

        if not directory_id:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(404,"no directory")
        
        yield from cursor.execute('''
            SELECT name, type, modify, size, md5, status FROM repository WHERE directory = %s
        ''',(directory_id))
        out = yield from cursor.fetchall()
        
        yield from cursor.close()
        connect.close()

        data = []
        for line in out:
            if line[0] == "":
                continue
            if line[5] == 0 and deleted == 'false':
                continue
            data.append({
                "name": line[0],
                "type": line[1],
                "extension": os.path.splitext(line[0])[-1][1:],
                "modify": toolbox.time_utc(line[2]),
                "owner": "self",
                "size": None if line[3] == 0 else line[3],
                "source": mask.generate(uid,line[4],os.path.splitext(line[0])[-1][1:]) if line[1] != 'directory' else '',
                "status": line[5]
            })

        return toolbox.javaify(200,"ok",data)
