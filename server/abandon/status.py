import asyncio
import datetime, os
from . import toolbox, fs
from aiohttp_session import get_session

@asyncio.coroutine
def route(request):

    session = yield from get_session(request)
    if 'uid' in session:
        uid = session['uid']
    else:
        # uid = 4
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

        directory_check = yield from fs.directory_exists(cursor,uid,directory)
        
        if not directory_check:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"target error")

        file_check = yield from fs.file_query(cursor,uid,directory,names)

        if not file_check:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        elif len(file_check) != len(names):
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        data = []

        for item in file_check:
            
            if item['type'] == 'directory':

                yield from cursor.execute('''
                    SELECT name, type, modify, size, status FROM garage 
                    WHERE uid = %s AND directory = %s
                ''',(uid,os.path.join(directory,item['name'])))
                result = yield from cursor.fetchall()

                for line in result:
                    data.append({
                        "name": line[0],
                        "type": line[1],
                        "modify": toolbox.time_utc(line[2]),
                        "size": None if line[3] == 0 else line[3],
                        "status": line[4]
                    })
                
                yield from cursor.execute('''
                    SELECT name, type, modify, size, status FROM garage 
                    WHERE uid = %s AND directory like %s
                ''',(uid,'{}/%'.format(os.path.join(directory,item['name']))))
                result = yield from cursor.fetchall()

                for line in result:
                    data.append({
                        "name": line[0],
                        "type": line[1],
                        "modify": toolbox.time_utc(line[2]),
                        "size": None if line[3] == 0 else line[3],
                        "status": line[4]
                    })

        yield from cursor.close()
        connect.close()

        return toolbox.javaify(200,'ok',data)


