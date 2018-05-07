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
        uid = 4
        # return toolbox.javaify(403,"forbidden")

    if request.content_type != "application/x-www-form-urlencoded":
        return toolbox.javaify(400,"wrong content type")

    data = yield from request.post()
    action = request.match_info["action"]

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

        if directory_check and directory_check['status'] == 0 and action == 'remove':
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"target error")

        if directory_check and directory_check['status'] == 0 and action == 'recover':
            guarantee = yield from fs.path_recover(cursor,uid,directory)
            if not guarantee:
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

        if action == 'recover':
            mark = 1
            names_indeed = [item['name'] for item in file_check if item['status'] == 0]

        elif action == 'remove':
            mark = 0
            names_indeed = [item['name'] for item in file_check if item['status'] == 1]

        elif action == 'smash':
            mark = -1
            names_indeed = [item['name'] for item in file_check if item['status'] == 0]

        if len(names_indeed) != len(names):
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        for item in file_check:
            if item['type'] == 'directory' and mark != -1:
                yield from fs.directory_mark(cursor,uid,os.path.join(directory,item['name']),mark)
            
            elif item['type'] != 'directory' and mark != -1:
                yield from fs.file_mark(cursor,uid,os.path.join(directory,item['name']),mark)
            
            elif item['type'] == 'directory' and mark == -1:
                yield from fs.directory_delete(cursor,uid,os.path.join(directory,item['name']))
            
            elif item['type'] != 'directory' and mark == -1:
                yield from fs.file_delete(cursor,uid,os.path.join(directory,item['name']))

        yield from connect.commit()
        yield from cursor.close()
        connect.close()

        now = datetime.datetime.now()
        
        return toolbox.javaify(200,"success",{
            "modify": toolbox.time_utc(now),
        })
        
