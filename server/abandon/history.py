import asyncio
import os
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
    
    path = query_parameters["path"] if "path" in query_parameters else ''

    if not path:
        return toolbox.javaify(400,"miss parameter")

    directory,name = os.path.split(path)

    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        yield from cursor.execute('''
            SELECT garage.id, garage.type, garage.size, garage.md5, user.name FROM garage, user 
            WHERE garage.uid = %s AND garage.directory = %s AND garage.name = %s AND garage.uid = user.id
        ''',(uid,directory,name))

        check = yield from cursor.fetchone()
        operator = check[4]

        if not check or check[1] == 'directory':
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        yield from cursor.execute('''
            SELECT id, occur, action, original, modify from operation WHERE gid = %s ORDER BY id DESC
        ''',(check[0],))

        result = yield from cursor.fetchall()
        yield from cursor.close()
        connect.close()

        data = []

        name_previous = name
        type_previous = check[1]
        size_previous = check[2]
        md5_previous = check[3]

        for line in result:

            action = line[2]
            
            if action == 0 or action == 1:
                type_previous, size_previous, md5_previous = line[4].split('|')

            item = {
                'name': name_previous,
                'modify': toolbox.time_utc(line[1]),
                'type': type_previous,
                'action': ['create','rewrite','rename','move','copy','move_rename','copy_rename','delete','recover','save'][action],
                'operator': operator,
                'size': size_previous,
                'mark': mask.encrypt(str(line[0]))
            }

            if action == 2:
                name_previous = line[3]
                item['name'] = name_previous
                item['rename'] = line[4]

            elif action in [3,4,5,6]:
                item['from'] = line[3].split('|')[0]
                item['to'] =  line[4].split('|')[0]

            elif action in [5,6]:
                name_previous = line[3].split('|')[1]
                item['name'] = name_previous
                item['rename'] = line[4].split('|')[1]

            data.append(item)

        return toolbox.javaify(200,'ok',data)

