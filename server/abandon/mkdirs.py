import asyncio
import os, datetime
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
        
        if not directory_check or directory_check['status'] == 0:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"target error")

        exist_check = yield from fs.file_query(cursor,uid,directory,names)

        for item in exist_check:
            if item['status'] == 0:
                if item["type"] == "directory":
                    yield from fs.directory_delete(cursor,uid,os.path.join(directory,item["name"]))
                else:
                    yield from fs.file_delete(cursor,uid,os.path.join(directory,item["name"] ))
            else: 
                # item['type'] != 'directory' no care failure
                names.remove(item['name'])

        params = [os.path.split(os.path.join(directory,name)) for name in names]
        params = [item for item in params if not fs.name_illegal(item[1])]

        yield from cursor.executemany('''
            INSERT INTO garage VALUES (null,'%s',%%s,%%s,'directory',now(),0,'',0,1)
        '''%(uid),params)

        yield from connect.commit()
        yield from cursor.close()
        connect.close()

        return toolbox.javaify(200,"success")