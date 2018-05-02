import http.client

conn = http.client.HTTPConnection("up-z2.qiniu.com")

conn.request("GET","http://up-z2.qiniu.com/")

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
