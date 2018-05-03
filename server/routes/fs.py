import asyncio
import os, re, datetime
from . import toolbox

# import filetype, magic
# def mime_hint():
#     pass

# def mime_detect(chunk):
#     guess_mime = magic.from_buffer(chunk,mime=True)
#     if guess_mime == "application/octet-stream":
#         kind = filetype.guess(chunk)
#         if kind:
#             guess_mime = kind.mime
#     return guess_mime

# def mime_detect(path):
#     guess_mime = magic.from_file(path,mime=True)
#     if guess_mime == "application/octet-stream":
#         kind = filetype.guess(path)
#         if kind:
#             guess_mime = kind.mime
#     return guess_mime


def name_illegal(name):
    if re.search(r'[\\|/|:|*|?|"|<|>|\|]',name):
        return True
    else:
        return False


def path_involve(path_a,path_b):
    path_a = list(filter(None,path_a.split('/')))
    path_b = list(filter(None,path_b.split('/')))
    
    involve = True if path_b else False
    for index in range(len(path_b)):
        if index >= len(path_a):
            break
        elif path_a[index] != path_b[index]:
            involve = False
            break
    return involve


@asyncio.coroutine
def directory_exists(cursor,uid,path):

    path = list(filter(None,path.split('/')))

    path.reverse()
    for x in range(len(path)+1):
        if x == 0:
            sentence = 'SELECT id FROM repository WHERE name = %s AND type = "directory" AND status = 1 AND directory = 0'
        else:
            sentence = 'SELECT id FROM repository WHERE name = %%s AND type = "directory" AND status = 1 AND directory = (%s)'%(sentence)

    yield from cursor.execute(sentence,tuple(path+[uid,]))
    check = yield from cursor.fetchone()

    if check:
        return check[0]
    else:
        return None


@asyncio.coroutine
def file_delete(cursor,file_ids):

    yield from cursor.execute('''
        DELETE FROM repository WHERE id in (%s)
    '''%(', '.join(['%s'] * (len(file_ids)))),tuple(file_ids))

    # only one level unimportant
    # yield from cursor.execute('''
    #     DELETE FROM repository WHERE directory in (%s)
    # '''%(', '.join(['%s'] * (len(file_ids)))),(file_ids))


@asyncio.coroutine
def file_delete_async(pool,file_ids):

    with (yield from pool) as connect:
        cursor = yield from connect.cursor()

        while file_ids:

            yield from cursor.execute('''
                DELETE FROM repository WHERE id in (%s)
            '''%(', '.join(['%s'] * (len(file_ids)))),tuple(file_ids))

            yield from cursor.execute('''
                SELECT id FROM repository WHERE type = 'directory' AND directory in (%s)
            '''%(', '.join(['%s'] * (len(file_ids)))),tuple(file_ids))

            abandon = yield from cursor.fetchall()

            file_ids = [item[0] for item in abandon]                

        yield from connect.commit()
        yield from cursor.close()
        connect.close()


@asyncio.coroutine
def file_mark(cursor,file_ids,status):

    yield from cursor.execute('''
        UPDATE repository SET status = %%s WHERE id in (%s)
    '''%(', '.join(['%s'] * (len(file_ids)))),tuple([status,]+file_ids))


@asyncio.coroutine
def file_query(cursor,directory_id,names):

    yield from cursor.execute('''
        SELECT id, name, type, modify, size, md5, status FROM repository 
        WHERE directory = %%s AND name in (%s)
    '''%(', '.join(['%s'] * (len(names)))),tuple([directory_id,]+names))
    
    check = yield from cursor.fetchall()

    return [{"id":item[0],"name":item[1],"type":item[2],"modify":item[3],"size":item[4],"md5":item[5],"status":item[6]} for item in check]


@asyncio.coroutine
def file_create(cursor,file_meta):

    # file_meta = {
    #     "directory":,
    #     "name":,
    #     "type":,
    #     "modify":,
    #     "size":,
    #     "md5":,
    #     "share":,
    #     "status":,
    # }

    file_meta['id'] = None
    file_meta['share'] = 0 if 'share' not in file_meta else file_meta['share']
    file_meta['status'] = 1 if 'status' not in file_meta else file_meta['status']

    part = []
    data = []

    for key in file_meta:
        part.append(key)
        data.append(file_meta[key])

    yield from cursor.execute('''
        INSERT INTO repository (%s) VALUES (%s)
    '''%(", ".join(part),", ".join(['%s'] * (len(data)))),tuple(data))

    yield from cursor.execute('''
        SELECT LAST_INSERT_ID()
    ''')

    (file_id,) = yield from cursor.fetchone()

    return file_id


@asyncio.coroutine
def file_modify(cursor,file_id,file_meta):

    # file_meta = {
    #     "name":,
    #     "directory":,
    #     "type":,
    #     "modify":,
    #     "size":,
    #     "md5":,
    #     "status":,
    # }

    part = []
    data = []

    for key in file_meta:
        part.append("{} = %s".format(key))
        data.append(file_meta[key])

    yield from cursor.execute('''
        UPDATE repository SET %s WHERE id = %%s
    '''%(', '.join(part)),(tuple(data+[file_id,])))


@asyncio.coroutine
def file_move(cursor,src_file_ids,dst_directory_id):

    yield from cursor.execute('''
        UPDATE repository SET directory = %%s WHERE id in (%s)
    '''%(', '.join(['%s'] * (len(src_file_ids)))),tuple([dst_directory_id,]+src_file_ids))


@asyncio.coroutine
def file_copy(cursor,src_file_id,dst_directory_id,rename=None):

    now = datetime.datetime.now()

    yield from cursor.execute('''
        SELECT name, type, size, md5, status FROM repository WHERE id = %s
    ''',(src_file_id))
    file_meta = yield from cursor.fetchone()

    rename = file_meta[0] if not rename else rename

    new_file_id = yield file_create(cursor,{
        "directory": dst_directory_id,
        "name": rename,
        "modify": toolbox.time_str(now),
        "type": file_meta[1],
        "size": file_meta[2],
        "md5": file_meta[3],
        "status": file_meta[4],
    })

    if file_meta[1] == 'directory':

        yield from cursor.execute('''
            SELECT id, name, type, size, md5, status FROM repository WHERE directory = %s
        ''',(src_file_id))
        result = yield from cursor.fetchall()

        for item in result:

            yield from file_copy(cursor,item[0],new_file_id)


@asyncio.coroutine
def version_sync(cursor,file_id):

    yield from cursor.execute('''
        SELECT id, name, modify, size, md5 FROM repository WHERE id = %s
    ''',(file_id))
    
    file_meta = yield from cursor.fetchone()
    
    yield from cursor.execute('''
        SELECT count(*) FROM history WHERE id = %s
    ''',(file_id))

    (version,) = yield from cursor.fetchone()

    file_meta = list(file_meta)
    file_meta.insert(1,version + 1)

    yield from cursor.execute('''
        INSERT INTO history (id, version, name, modify, size, md5) VALUES (%s, %s, %s, %s, %s, %s)
    ''',tuple(file_meta))