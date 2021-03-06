import asyncio
import os, json, time, base64, hmac, hashlib 
from aiohttp import FormData, ClientSession

qiniu_domain_name = os.environ["QINIU_DOMAIN"]
qiniu_bucket_name = os.environ["QINIU_BUCKET"]
qiniu_access_key = os.environ["QINIU_ACCESS"]
qiniu_secret_key = os.environ["QINIU_SECRET"]

def upload_token(store_key):

    put_policy = {
        "scope": "{}:{}".format(qiniu_bucket_name,store_key),
        "deadline": int(time.time()) + 3600, 
        "returnBody": json.dumps({
            "key":"$(key)",
            "type":"$(mimeType)",
            "size":"$(fsize)",
        },separators=(',',':'))
    }

    put_policy = json.dumps(put_policy,separators=(',',':'))
    encoded_put_policy = base64.urlsafe_b64encode(put_policy.encode("utf-8"))
    sign = hmac.new(qiniu_secret_key.encode("utf-8"), encoded_put_policy, hashlib.sha1)
    encoded_sign = base64.urlsafe_b64encode(sign.digest())
    token = '{}:{}:{}'.format(qiniu_access_key,encoded_sign.decode("utf-8"),encoded_put_policy.decode("utf-8"))

    return token

def pfop_token(path,body):

    sign_string = "{}\n{}".format(path,body)
    sign = hmac.new(qiniu_secret_key.encode("utf-8"), sign_string.encode("utf-8"), hashlib.sha1)
    encoded_sign = base64.urlsafe_b64encode(sign.digest())
    token = '{}:{}'.format(qiniu_access_key,encoded_sign.decode("utf-8"))

    return token

def dynamic_url(uid,md5,style=None):

    download_url = "http://{domain_name}/{uid}/{md5}{style}?e={deadline}".format(
        domain_name = qiniu_domain_name,
        uid = str(uid).zfill(8),
        md5 = md5,
        style = '/{}'.format(style) if style else '',
        deadline = int(time.time()) + 3600
    )

    sign = hmac.new(qiniu_secret_key.encode("utf-8"), download_url.encode("utf-8"), hashlib.sha1)
    encoded_sign = base64.urlsafe_b64encode(sign.digest())
    token = '{}:{}'.format(qiniu_access_key,encoded_sign.decode("utf-8"))

    return '{}&token={}'.format(download_url,token)

def bucket_url(tag):

    download_url = "http://{domain_name}/{tag}?e={deadline}".format(
        domain_name = qiniu_domain_name,
        tag = tag,
        deadline = int(time.time()) + 3600
    )

    sign = hmac.new(qiniu_secret_key.encode("utf-8"), download_url.encode("utf-8"), hashlib.sha1)
    encoded_sign = base64.urlsafe_b64encode(sign.digest())
    token = '{}:{}'.format(qiniu_access_key,encoded_sign.decode("utf-8"))

    return '{}&token={}'.format(download_url,token)


@asyncio.coroutine
def transmit(temp_path,store_key):

    if os.path.exists(temp_path):
        print('ok it saved')

    print(temp_path)
    print(store_key)

    token = upload_token(store_key)
    
    data = FormData()
    data.add_field('key', store_key)
    data.add_field('token', token)
    data.add_field('file',
                   open(temp_path, 'rb'),
                   filename = os.path.split(temp_path)[-1],
                   content_type = 'application/octet-stream')

    session = ClientSession()
    response = yield from session.post('http://up-z2.qiniu.com',data = data)
    text = yield from response.text()
    yield from session.close()
    print(text)
    os.remove(temp_path)
    return