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
        return toolbox.javaify(403,"forbidden")

    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        root = yield from fs.directory_exists(cursor,uid,'/')
        if not root:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(403,"forbidden")

        name = {root:'/'}
        relationship = {root:[]}

        outer_dir = list(str(root))

        while outer_dir:

            yield from cursor.execute('''
                SELECT id, directory, name from repository WHERE type = "directory" AND status = 1 AND directory in (%s)
            '''%(', '.join(['%s'] * (len(outer_dir)))),tuple(outer_dir))
            result = yield from cursor.fetchall()

            outer_dir = [str(item[0]) for item in result]

            for line in result:
                name[line[0]] = line[2]
                relationship[line[0]] = []
                relationship[line[1]].append(line[0])


        def build_tree(directory_id):
            data = {'name':name[directory_id],'children':[]}
            if not relationship[directory_id]:
                return data
            else:
                for inner_id in relationship[directory_id]:
                    data['children'].append(build_tree(inner_id))
                return data
      
        tree = build_tree(root)

        return toolbox.javaify(200,"ok",tree)
