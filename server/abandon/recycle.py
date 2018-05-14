import asyncio
import os, operator
from . import toolbox, mask, fs
from aiohttp_session import get_session

@asyncio.coroutine
def route(request):

    session = yield from get_session(request)
    if 'uid' in session:
        uid = session['uid']
    else:
        # uid = 4
        return toolbox.javaify(403,"forbidden")

    query_parameters = request.rel_url.query

    path = query_parameters["path"] if "path" in query_parameters else '/'

    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        if path == '/':
            yield from cursor.execute('''
                SELECT directory, name, modify FROM garage WHERE uid = %s AND type = 'directory' AND status = 0
            ''',(uid,))
        else:
            yield from cursor.execute('''
                SELECT directory, name, modify 
                FROM (SELECT directory, name, modify FROM garage WHERE uid = %s AND type = 'directory' AND status = 0) private
                WHERE directory = %s OR directory LIKE %s
            ''',(uid,path,'{}/%'.format(path)))
        
        directories = yield from cursor.fetchall()

        contain_check = {os.path.join(directory[0],directory[1]):'' for directory in directories}

        directories = [directory for directory in directories if directory[0] not in contain_check]

        param = [os.path.join(line[0],line[1]) for line in directories]

        files = []

        if param:

            if path == '/':
                yield from cursor.execute('''
                    SELECT directory, name, type, modify, size FROM garage 
                    WHERE uid = %%s AND type != 'directory' AND status = 0 AND directory NOT IN (%s)
                '''%(', '.join(['%s'] * (len(param)))),tuple([uid,]+param))
            
            else:
                yield from cursor.execute('''
                    SELECT directory, name, type, modify, size
                    FROM (SELECT directory, name, type, modify, size FROM garage WHERE uid = %%s AND type != 'directory' AND status = 0 AND directory NOT IN (%s)) private
                    WHERE directory = %%s OR directory LIKE %%s
                '''%(', '.join(['%s'] * (len(param)))),tuple([uid,]+param+[path,'{}/%'.format(path)]))

        else:

            if path == '/':
                yield from cursor.execute('''
                    SELECT directory, name, type, modify, size FROM garage 
                    WHERE uid = %s AND status = 0
                '''%(uid,))
            
            else:
                yield from cursor.execute('''
                    SELECT directory, name, type, modify, size
                    FROM (SELECT directory, name, type, modify, size FROM garage WHERE uid = %s AND status = 0) private
                    WHERE directory = %s OR directory LIKE %s
                ''',(uid,path,'{}/%'.format(path)))

        
        files = yield from cursor.fetchall()

        yield from cursor.close()
        connect.close()

        data = []

        for line in directories:
            
            data.append({
                "name": line[1],
                "type": 'directory',
                "directory": line[0],
                "modify": toolbox.time_utc(line[2]),
                "size": None
            })

        for line in files:

            data.append({
                "name": line[1],
                "type": line[2],
                "directory": line[0],
                "modify": toolbox.time_utc(line[3]),
                "size": None if line[4] == 0 else line[4]
            })

        data = sorted(data, key = operator.itemgetter('modify') ,reverse=True)

        return toolbox.javaify(200,'ok',data)