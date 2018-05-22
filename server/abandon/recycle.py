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

    directory = query_parameters["dir"] if "dir" in query_parameters else '/'

    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        if directory == '/':
            yield from cursor.execute('''
                SELECT directory, name, modify FROM garage WHERE uid = %s AND type = 'directory' AND status = 0
            ''',(uid,))
        else:
            yield from cursor.execute('''
                SELECT directory, name, modify 
                FROM (SELECT directory, name, modify FROM garage WHERE uid = %s AND type = 'directory' AND status = 0) private
                WHERE directory = %s OR directory LIKE %s
            ''',(uid,directory,'{}/%'.format(directory)))
        
        directories = yield from cursor.fetchall()

        contain_check = {os.path.join(item[0],item[1]):'' for item in directories}

        directories = [item for item in directories if item[0] not in contain_check]

        param = [os.path.join(line[0],line[1]) for line in directories]

        files = []

        if param:

            if directory == '/':
                yield from cursor.execute('''
                    SELECT directory, name, type, modify, size FROM garage 
                    WHERE uid = %%s AND type != 'directory' AND status = 0 AND directory NOT IN (%s)
                '''%(', '.join(['%s'] * (len(param)))),tuple([uid,]+param))
            
            else:
                yield from cursor.execute('''
                    SELECT directory, name, type, modify, size
                    FROM (SELECT directory, name, type, modify, size FROM garage WHERE uid = %%s AND type != 'directory' AND status = 0 AND directory NOT IN (%s)) private
                    WHERE directory = %%s OR directory LIKE %%s
                '''%(', '.join(['%s'] * (len(param)))),tuple([uid,]+param+[directory,'{}/%'.format(directory)]))

        else:

            if directory == '/':
                yield from cursor.execute('''
                    SELECT directory, name, type, modify, size FROM garage 
                    WHERE uid = %s AND status = 0
                '''%(uid,))
            
            else:
                yield from cursor.execute('''
                    SELECT directory, name, type, modify, size
                    FROM (SELECT directory, name, type, modify, size FROM garage WHERE uid = %s AND status = 0) private
                    WHERE directory = %s OR directory LIKE %s
                ''',(uid,directory,'{}/%'.format(directory)))

        
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