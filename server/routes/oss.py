import asyncio
import os, json, time, base64, hmac, hashlib 
from aiohttp import FormData, ClientSession

qiniu_domain_name = os.environ["QINIU_DOMAIN"]
qiniu_bucket_name = os.environ["QINIU_BUCKET"]
qiniu_access_key = os.environ["QINIU_ACCESS"]
qiniu_secret_key = os.environ["QINIU_SECRET"]

@asyncio.coroutine
def transmit(temp_path,store_key):
    print(store_key)
    put_policy = json.dumps({
      "scope": "{}:{}".format(qiniu_bucket_name,store_key),
      "deadline": int(time.time()) + 3600
    }, separators = (',',':'))

    encoded_put_policy = base64.urlsafe_b64encode(put_policy.encode("utf-8"))
    sign = hmac.new(qiniu_secret_key.encode("utf-8"), encoded_put_policy, hashlib.sha1)
    encoded_sign = base64.urlsafe_b64encode(sign.digest())
    upload_token = '{}:{}:{}'.format(qiniu_access_key,encoded_sign.decode("utf-8"),encoded_put_policy.decode("utf-8"))

    data = FormData()
    data.add_field('key', store_key)
    data.add_field('token', upload_token)
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
    download_token = '{}:{}'.format(qiniu_access_key,encoded_sign.decode("utf-8"))

    return '{}&token={}'.format(download_url,download_token)