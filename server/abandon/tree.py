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
        uid = 4
        # return toolbox.javaify(403,"forbidden")

    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        yield from cursor.execute('''
            SELECT id, directory, name FROM garage WHERE uid = %s AND status = 1 AND type = 'directory' ORDER BY directory
        ''',(uid))

        result = yield from cursor.fetchall()

        id_to_path = {item[0]:os.path.join(item[1],item[2]) for item in result}

        path_to_id = {os.path.join(item[1],item[2]):item[0] for item in result}

        relationship = {item[0]:[] for item in result}

        root = path_to_id['/']

        for item in result:
            relationship[path_to_id[item[1]]].append(item[0])

        relationship[root].remove(root)

        def build_tree(directory_id):
            path = id_to_path[directory_id]
            name = os.path.split(path)[-1]
            data = {'name': name,
                    'path': path,
                    'children':[]}
            if not relationship[directory_id]:
                return data
            else:
                for inner_id in relationship[directory_id]:
                    data['children'].append(build_tree(inner_id))
                return data
      
        tree = build_tree(root)

        return toolbox.javaify(200,"ok",tree)
