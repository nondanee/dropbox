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
    name = data['name'] if 'name' in data else ''
    rename = data['rename'] if 'rename' in data else ''

    if directory == '/' and name == '':
        return toolbox.javaify(400,"bad request")

    if name == rename:
        return toolbox.javaify(200,"not modified",{
            "name": rename,
            "extension": os.path.splitext(rename)[-1][1:],
        })

    if fs.name_illegal(rename):
        return toolbox.javaify(400,"name illegal")


    with (yield from request.app['pool']) as connect:
        cursor = yield from connect.cursor()

        directory_check = yield from fs.directory_exists(cursor,uid,directory)
        
        if not directory_check or directory_check['status'] == 0:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"target error")

        name_check = yield from fs.file_exists(cursor,uid,os.path.join(directory,name))

        if not name_check or name_check['status'] == 0:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"source error")

        rename_check = yield from fs.file_exists(cursor,uid,os.path.join(directory,rename))

        if rename_check and rename_check['status'] == 0:
            if rename_check['type'] == 'directory':
                yield from fs.directory_delete(cursor,uid,os.path.join(directory,rename))
            else:
                yield from fs.file_delete(cursor,uid,os.path.join(directory,rename))
            rename_check = None

        if rename_check:

            serial = 1
            
            while True:
                rename_adjust = " ({})".format(serial).join(os.path.splitext(rename))
                
                if rename_adjust == name:
                    yield from cursor.close()
                    connect.close()
                    return toolbox.javaify(200,"not modified",{
                        "name": name,
                        "extension": os.path.splitext(name)[-1][1:],
                    })

                file_check = yield from fs.file_exists(cursor,uid,os.path.join(directory,rename_adjust))
                
                if not file_check:

                    rename = rename_adjust
                    break

                elif file_check['status'] == 0:

                    if file_check['type'] == 'directory':
                        yield from fs.directory_delete(cursor,uid,os.path.join(directory,rename_adjust))
                    else:
                        yield from fs.file_delete(cursor,uid,os.path.join(directory,rename_adjust))

                    rename = rename_adjust
                    break

                serial += 1


        if name_check['type'] != "directory":
            
            yield from fs.file_rename(cursor,uid,directory,name,rename)

        elif name_check['type'] == "directory":
            
            yield from fs.directory_rename(cursor,uid,directory,name,rename)

        yield from connect.commit()
        yield from cursor.close()
        connect.close()

        return toolbox.javaify(200,"success",{
            "name": rename,
            "extension": os.path.splitext(rename)[-1][1:],
        })

