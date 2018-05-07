import asyncio
import datetime, time, json, os, re
# import pytz
from aiohttp import web

def time_str(time_set):
    return time_set.strftime("%Y/%m/%d %H:%M:%S")

def time_utc(time_set):
    utc_time = time_set + datetime.timedelta(seconds=time.timezone)
    return utc_time.strftime("%Y-%m-%dT%H:%M:%SZ")
    # cn_time = pytz.timezone('Asia/Shanghai').localize(time_set)
    # return cn_time.astimezone(pytz.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def time_stamp(time_set):
    return int(time.mktime(time_set.timetuple()))

def jsonify(json_dict):
    return json.dumps(json_dict,ensure_ascii=False,sort_keys=True,indent=4)

def javaify(code,message,data=None):
    json_dict = {
        "code": code,
        "message": message,
        "data": data
    }
    return web.Response(
        text = jsonify(json_dict),
        content_type = "application/json",
        charset = "utf-8",
        headers = {
            "Access-Control-Allow-Origin": "*"
        },
    )

def abort(code):
    if code == 400: return web.HTTPBadRequest()
    elif code == 401: return web.HTTPUnauthorized()
    elif code == 402: return web.HTTPPaymentRequired()
    elif code == 403: return web.HTTPForbidden()
    elif code == 404: return web.HTTPNotFound()
    elif code == 405: return web.HTTPMethodNotAllowed()
    elif code == 406: return web.HTTPNotAcceptable()
    elif code == 407: return web.HTTPProxyAuthenticationRequired()
    elif code == 408: return web.HTTPRequestTimeout()
    elif code == 409: return web.HTTPConflict()
    elif code == 410: return web.HTTPGone()
    elif code == 411: return web.HTTPLengthRequired()
    elif code == 412: return web.HTTPPreconditionFailed()
    elif code == 413: return web.HTTPRequestEntityTooLarge()
    elif code == 414: return web.HTTPRequestURITooLong()
    elif code == 415: return web.HTTPUnsupportedMediaType()
    elif code == 416: return web.HTTPRequestRangeNotSatisfiable()
    elif code == 417: return web.HTTPExpectationFailed()
    elif code == 421: return web.HTTPMisdirectedRequest()
    elif code == 422: return web.HTTPUnprocessableEntity()
    elif code == 424: return web.HTTPFailedDependency()
    elif code == 426: return web.HTTPUpgradeRequired()
    elif code == 428: return web.HTTPPreconditionRequired()
    elif code == 429: return web.HTTPTooManyRequests()
    elif code == 431: return web.HTTPRequestHeaderFieldsTooLarge()
    elif code == 451: return web.HTTPUnavailableForLegalReasons()
    else: return web.HTTPBadRequest()


