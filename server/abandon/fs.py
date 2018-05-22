import asyncio
import os, re, datetime
from . import toolbox

def name_illegal(name):
    if re.search(r'[\\|/|:|*|?|"|<|>|\|]',name):
        return True
    else:
        return False

# b is in a
def path_involve(path_a,path_b):
    path_a = list(filter(None,path_a.split('/')))
    path_b = list(filter(None,path_b.split('/')))

    if len(path_a) > len(path_b):
        return False
    
    involve = True if path_b else False
    for index in range(len(path_b)):
        if index >= len(path_a):
            break
        elif path_a[index] != path_b[index]:
            involve = False
            break
    return involve

@asyncio.coroutine
def file_query(cursor,uid,directory,names):

    yield from cursor.execute('''
        SELECT id, name, type, status FROM garage 
        WHERE uid = %%s AND directory = %%s AND name in (%s)
    '''%(', '.join(['%s'] * (len(names)))),tuple([uid,directory,]+names))
    check = yield from cursor.fetchall()

    return [{'id':item[0],'name':item[1],'type':item[2],'status':item[3]} for item in check]


@asyncio.coroutine
def file_exists(cursor,uid,path):

    directory,name = os.path.split(path)
    yield from cursor.execute('''
        SELECT id, type, status FROM garage WHERE uid = %s AND directory = %s AND name = %s
    ''',(uid,directory,name))
    check = yield from cursor.fetchone()

    if check:
        return {'id':check[0],'type':check[1],'status':check[2]}
    else:
        return None

@asyncio.coroutine
def directory_exists(cursor,uid,path):

    directory,name = os.path.split(path)

    yield from cursor.execute('''
        SELECT id, status FROM garage WHERE uid = %s AND directory = %s AND name = %s AND type = "directory"
    ''',(uid,directory,name))
    check = yield from cursor.fetchone()

    if check:
        return {'id':check[0],'status':check[1]}
    else:
        return None

@asyncio.coroutine
def file_delete(cursor,uid,path):

    directory,name = os.path.split(path)

    yield from cursor.execute('''
        DELETE FROM garage WHERE uid = %s AND directory = %s AND name = %s
    ''',(uid,directory,name))


@asyncio.coroutine
def directory_delete(cursor,uid,path):

    yield from file_delete(cursor,uid,path)

    yield from cursor.execute('''
        DELETE FROM garage WHERE uid = %s AND directory = %s
    ''',(uid,path))

    yield from cursor.execute('''
        DELETE FROM garage WHERE uid = %s AND directory LIKE %s
    ''',(uid,'{}/%'.format(path)))


@asyncio.coroutine
def file_mark(cursor,uid,path,status):

    if status == 0:
        action = 7
    elif status == 1:
        action = 8

    directory,name = os.path.split(path)

    yield from cursor.execute('''
        SELECT id, status, type from garage WHERE uid = %s AND directory = %s AND name = %s AND status != %s
    ''',(uid,directory,name,status))
    result = yield from cursor.fetchone()
    
    yield from cursor.execute('''
        UPDATE garage SET status = %s,modify = now() WHERE id = %s
    ''',(status,result[0]))

    if result[2] != 'directory':
        yield from cursor.execute('''
            INSERT INTO operation VALUES(null,%s,now(),%s,%s,%s)
        ''',(result[0],action,result[1],status))


@asyncio.coroutine
def directory_mark(cursor,uid,path,status):

    if status == 0:
        action = 7
    elif status == 1:
        action = 8

    yield from file_mark(cursor,uid,path,status)

    yield from cursor.execute('''
        SELECT id, status, type from garage WHERE uid = %s AND directory = %s AND status != %s
    ''',(uid,path,status))
    result = yield from cursor.fetchall()
    param_update = [[status,item[0]] for item in result]
    param_insert = [[item[0],action,item[1],status] for item in result if item[2] != 'directory']

    yield from cursor.execute('''
        SELECT id, status, type from garage WHERE uid = %s AND directory LIKE %s AND status != %s
    ''',(uid,'{}/%'.format(path),status))
    result = yield from cursor.fetchall()
    param_update += [[status,item[0]] for item in result]
    param_insert += [[item[0],action,item[1],status] for item in result if item[2] != 'directory']

    yield from cursor.executemany('''
        UPDATE garage SET status = %s,modify = now() WHERE id = %s
    ''',param_update)

    yield from cursor.executemany('''
        INSERT INTO operation VALUES(null,%s,now(),%s,%s,%s)
    ''',param_insert)


@asyncio.coroutine
def path_recover(cursor,uid,path):

    # if path == '' or path[0] != '/':
    #     return False

    # split = [os.path.split(path)]
    # while split[-1][0] != '/':
    #     split.append(os.path.split(split[-1][0]))

    param = []

    while True:

        directory_check = yield from directory_exists(cursor,uid,path)
        if not directory_check:
            return False
        elif directory_check['status'] == 1:
            break

        param.append([directory_check['id']])
        path,name = os.path.split(path)

    yield from cursor.executemany('''
        UPDATE garage SET status = 1 WHERE id = %s
    ''',param)

    return True


# | id        | int(8) unsigned zerofill | NO   | PRI | NULL    | auto_increment |
# | uid       | int(8) unsigned zerofill | NO   | MUL | NULL    |                |
# | directory | varchar(768)             | NO   | MUL | NULL    |                |
# | name      | varchar(400)             | NO   |     | NULL    |                |
# | type      | varchar(100)             | NO   |     | NULL    |                |
# | modify    | datetime                 | NO   |     | NULL    |                |
# | size      | int(10)                  | NO   |     | NULL    |                |
# | md5       | varchar(32)              | NO   |     | NULL    |                |
# | share     | tinyint(1)               | NO   |     | NULL    |                |
# | status    | tinyint(1)               | NO   |     | NULL    |                |


############
#  action  #
############
# 0 create
# 1 rewrite
# 2 rename
# 3 move
# 4 copy
# 5 move+rename
# 6 copy+rename
# 7 delete
# 8 recover
# 9 save


@asyncio.coroutine
def file_create(cursor,param):

    # param = [uid,directory,name,type,size,md5,status]

    yield from cursor.execute('''
        INSERT INTO garage VALUES (null,%s,%s,%s,%s,now(),%s,%s,0,%s)
    ''',param)

    if param[3] != 'directory':
        yield from cursor.execute('''
            SELECT LAST_INSERT_ID()
        ''')
        (gid,) = yield from cursor.fetchone()

        yield from cursor.execute('''
            INSERT INTO operation VALUES(null,%s,now(),%s,%s,%s)
        ''',(gid,0,'','{}|{}|{}'.format(param[3],param[4],param[5])))


@asyncio.coroutine
def file_rewrite(cursor,uid,path,param):

    # param = [type,size,md5]

    directory,name = os.path.split(path)

    yield from cursor.execute('''
        SELECT id, type, size, md5 FROM garage WHERE uid = %s AND directory = %s AND name = %s
    ''',(uid,directory,name))
    result = yield from cursor.fetchone()

    yield from cursor.execute('''
        UPDATE garage SET type = %s, modify = now(), size = %s, md5 = %s, status = 1 WHERE id = %s
    ''',tuple(param+[result[0],]))

    yield from cursor.execute('''
        INSERT INTO operation VALUES(null,%s,now(),%s,%s,%s)
    ''',(result[0],1,'{}|{}|{}'.format(result[1],result[2],result[3]),'{}|{}|{}'.format(param[0],param[1],param[2])))


@asyncio.coroutine
def file_rename(cursor,uid,directory,name,rename):

    yield from cursor.execute('''
        SELECT id, type FROM garage WHERE uid = %s AND directory = %s AND name = %s
    ''',(uid,directory,name))

    result = yield from cursor.fetchone()

    yield from cursor.execute('''
        UPDATE garage SET name = %s,modify = now() WHERE id = %s
    ''',(rename,result[0]))

    if result[1] != 'directory':
        yield from cursor.execute('''
            INSERT INTO operation VALUES(null,%s,now(),%s,%s,%s)
        ''',(result[0],2,name,rename))

@asyncio.coroutine
def directory_rename(cursor,uid,directory,name,rename):

    yield from file_rename(cursor,uid,directory,name,rename)

    path = os.path.join(directory,name)
    new_path = os.path.join(directory,rename)

    yield from cursor.execute('''
        SELECT id FROM garage WHERE uid = %s AND directory = %s
    ''',(uid,path))
    result = yield from cursor.fetchall()
    param_update = [[new_path,item[0]] for item in result]

    yield from cursor.execute('''
        SELECT id, directory FROM garage WHERE uid = %s AND directory LIKE %s
    ''',(uid,'{}/%'.format(path)))
    result = yield from cursor.fetchall()
    param_update += [[item[1].replace(path,new_path,1),item[0]] for item in result]

    yield from cursor.executemany('''
        UPDATE garage SET directory = %s WHERE id = %s
    ''',param_update)

@asyncio.coroutine
def file_move(cursor,uid,src,dst,name,rename=''):

    action = 3 if not rename else 5
    rename = name if not rename else rename

    yield from cursor.execute('''
        SELECT id, type FROM garage WHERE uid = %s AND directory = %s AND name = %s
    ''',(uid,src,name))

    result = yield from cursor.fetchone()

    yield from cursor.execute('''
        UPDATE garage SET directory = %s, name = %s, modify = now() WHERE id = %s
    ''',(dst,rename,result[0]))

    if result[1] != 'directory':
        yield from cursor.execute('''
            INSERT INTO operation VALUES(null,%s,now(),%s,%s,%s)
        ''',(result[0],action,'{}|{}'.format(src,name),'{}|{}'.format(dst,rename)))


@asyncio.coroutine
def directory_move(cursor,uid,src,dst,name,rename=''):

    yield from file_move(cursor,uid,src,dst,name,rename)

    rename = name if not rename else rename

    path = os.path.join(src,name)
    new_path = os.path.join(dst,rename)

    yield from cursor.execute('''
        SELECT id, type FROM garage WHERE uid = %s AND directory = %s
    ''',(uid,path))
    result = yield from cursor.fetchall()
    param_update = [[new_path,item[0]] for item in result]
    param_insert = [[item[0],3,path,new_path] for item in result if item[1] != 'directory']

    yield from cursor.execute('''
        SELECT id, directory, type FROM garage WHERE uid = %s AND directory LIKE %s
    ''',(uid,'{}/%'.format(path)))
    result = yield from cursor.fetchall()
    param_update += [[item[1].replace(path,new_path,1),item[0]] for item in result]
    param_insert += [[item[0],3,item[1],item[1].replace(path,new_path,1)] for item in result if item[2] != 'directory']

    yield from cursor.executemany('''
        UPDATE garage SET directory = %s, modify = now() WHERE id = %s
    ''',param_update)

    yield from cursor.executemany('''
        INSERT INTO operation VALUES(null,%s,now(),%s,%s,%s)
    ''',param_insert)


@asyncio.coroutine
def file_copy(cursor,uid,src,dst,name,rename=''):

    action = 4 if not rename else 6
    rename = name if not rename else rename

    yield from cursor.execute('''
        SELECT type, size, md5, status FROM garage WHERE uid = %s AND directory = %s AND name = %s
    ''',(uid,src,name))

    result = yield from cursor.fetchone()

    yield from cursor.execute('''
        INSERT INTO garage VALUES (null,%s,%s,%s,%s,now(),%s,%s,0,%s)
    ''',tuple([uid,dst,rename]+list(result)))
    
    yield from cursor.execute('''
        SELECT LAST_INSERT_ID()
    ''')
    (gid,) = yield from cursor.fetchone()

    yield from cursor.execute('''
        INSERT INTO operation VALUES(null,%s,now(),%s,%s,%s)
    ''',(gid,action,'{}|{}'.format(src,name),'{}|{}'.format(dst,rename)))


@asyncio.coroutine
def directory_copy(cursor,uid,src,dst,name,rename=''):

    yield from file_copy(cursor,uid,src,dst,name,rename)

    rename = name if not rename else rename

    path = os.path.join(src,name)
    new_path = os.path.join(src,rename)

    yield from cursor.execute('''
        SELECT name, type, size, md5, status FROM garage WHERE uid = %s AND directory = %s
    ''',(uid,path))
    result = yield from cursor.fetchall()
    params = [[uid,dst] + list(item) for item in result]
    prepare = [[src,dst] for item in result]

    yield from cursor.execute('''
        SELECT directory, name, type, size, md5, status FROM garage WHERE uid = %s AND directory LIKE %s
    ''',(uid,'{}/%'.format(path)))
    result = yield from cursor.fetchall()
    params += [[uid,item[0].replace(path,new_path,1)] + list(item[1:]) for item in result]
    prepare += [[item[0],item[0].replace(path,new_path,1)] for item in result]

    param_insert = []

    for index,param in enumerate(params):

        yield from cursor.execute('''
            INSERT INTO garage VALUES (null,%s,%s,%s,%s,now(),%s,%s,0,%s)
        ''',param)

        if param[3] != 'directory':
            yield from cursor.execute('''
                SELECT LAST_INSERT_ID()
            ''')
            (gid,) = yield from cursor.fetchone()
            param_insert.append([gid,4]+prepare[index])

    yield from cursor.executemany('''
        INSERT INTO operation VALUES(null,%s,now(),%s,%s,%s)
    ''',param_insert)