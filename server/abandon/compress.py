import asyncio, aiohttp
import urllib.parse, base64, os, json
from . import toolbox, mask, oss, fs
from aiohttp_session import get_session
from aiohttp import ClientSession

@asyncio.coroutine
def route(request):

    # TODO 
    # request.headers["Referer"]

    session = yield from get_session(request)
    if 'uid' in session:
        uid = session['uid']
    else:
        uid = 4
        # return toolbox.javaify(403,"forbidden")

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

        yield from cursor.execute('''
            SELECT name, type, status, md5 FROM garage 
            WHERE uid = %%s AND directory = %%s AND name in (%s)
        '''%(', '.join(['%s'] * (len(names)))),tuple([uid,directory,]+names))
        file_check = yield from cursor.fetchall()

        if not file_check:
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        elif len(file_check) != len(names):
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        names_indeed = [item[0] for item in file_check if item[2] == 1]

        if len(names_indeed) != len(names):
            yield from cursor.close()
            connect.close()
            return toolbox.javaify(400,"bad request")

        param = []

        for line in file_check:

            if line[1] != 'directory':

                param.append([line[0],line[3]])

            else:

                yield from cursor.execute('''
                    SELECT name, md5 from garage WHERE uid = %s AND directory = %s AND status = 1 AND type != 'directory'
                ''',(uid,os.path.join(directory,line[0])))

                result = yield from cursor.fetchall()
                param += [[os.path.join(line[0],item[0]),item[1]] for item in result]

                yield from cursor.execute('''
                    SELECT directory, name, md5 from garage WHERE uid = %s AND directory like %s AND status = 1 AND type != 'directory'
                ''',(uid,'{}/%'.format(os.path.join(directory,line[0]))))

                result = yield from cursor.fetchall()
                param += [[os.path.join(item[0].replace(directory,'',1),item[1]),item[2]] for item in result]

                yield from cursor.close()
                connect.close()

        if not param:
            return toolbox.javaify(400,"empty")

        if len(file_check) == 1 and file_check[0][1] == 'directory':
            param = [[item[0].replace(file_check[0][0],'',1),item[1]] for item in param]

        fops = 'mkzip/2/encoding/{}'.format(base64.urlsafe_b64encode('gbk'.encode("utf-8")).decode("utf-8"))
        for line in param:
            url = oss.dynamic_url(uid,line[1])
            path = line[0]
            path = path[1:] if path[0] == '/' else path
            url = base64.urlsafe_b64encode(url.encode("utf-8")).decode("utf-8")
            path = base64.urlsafe_b64encode(path.encode("utf-8")).decode("utf-8")
            fops += '/url/{}/alias/{}'.format(url,path)

        fops = urllib.parse.quote_plus(fops)
        body = 'bucket={}&key=placeholder&fops={}'.format(os.environ["QINIU_BUCKET"],fops)
        token = oss.pfop_token('/pfop/',body)


    session = ClientSession(headers={
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'QBox {}'.format(token),
        'Host': 'api.qiniu.com'
    })

    try:
        response = yield from session.post('http://api.qiniu.com/pfop/',data=body.encode())
        json_back = yield from response.text()
        json_back = json.loads(json_back)
        persistent_id = json_back['persistentId']
    except Exception as error:
        print(error)
        yield from session.close()
        return toolbox.javaify(500,"something wrong")
    else:
        yield from session.close()

    session = ClientSession()
    tag = ''
    
    for i in range(5):
        
        try:
            response = yield from session.post('http://api.qiniu.com/status/get/prefop',params={'id':persistent_id})
            json_back = yield from response.text()
            json_back = json.loads(json_back)
            tag = json_back['items'][0]['key']
        except Exception as error:
            print(error)
            yield from asyncio.sleep(2)
        else:
            break

    yield from session.close()

    if not tag:
        return toolbox.javaify(500,'something wrong')
    else:
        tag = mask.encrypt(tag)
        return toolbox.javaify(200,'ok',{"tag":tag})