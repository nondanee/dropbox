# -*- coding: utf-8 -*-
import asyncio, aiomysql
import pathlib, base64
import os, urllib.parse
# import logging

from aiohttp import web
from cryptography import fernet
from aiohttp_session import setup, get_session, session_middleware
from aiohttp_session.cookie_storage import EncryptedCookieStorage

from . import routes
from . import abandon
# import routes

working_directory = pathlib.Path(__file__).resolve().parents[1]

database_url = os.environ["CLEARDB_DATABASE_URL"]
urllib.parse.uses_netloc.append("mysql")
database = urllib.parse.urlparse(database_url)

@asyncio.coroutine
def create_pool(app):
    pool = yield from aiomysql.create_pool(
        host = database.hostname, 
        user = database.username,
        password = database.password,
        db = database.path[1:],
        charset = "utf8mb4",
        loop = app.loop
    )
    app['pool'] = pool

# @asyncio.coroutine
# def create_pool_pg(app):
#     pool = yield from aiopg.create_pool(
#         '''dbname=devs8tb30rdln2
#            user=ajdeyhnargzdnw
#            password=2f036523655f09aa6daa042c5402cc009effc6abf6fa625d57e091aa225dfaa2
#            host=ec2-107-20-133-82.compute-1.amazonaws.com
#            port=5432
#         '''
#     )
#     app['pool'] = pool


@asyncio.coroutine
def init(loop=None):
    app = web.Application(loop=loop,client_max_size=0)
    app.on_startup.append(create_pool)
    # app.on_startup.append(create_pool_pg)

    # app["working_dir"] = str(working_directory)
    # app["temp_dir"] = str(working_directory/"temp")
    app["session_expire"] = 1296000

    # fernet_key = fernet.Fernet.generate_key()
    fernet_key = b'wAYavr8zyR2kvmf1uXGko4MdGJ8cpDFOUW0lHIxoQ-I='
    secret_key = base64.urlsafe_b64decode(fernet_key)
    # 
    setup(app, EncryptedCookieStorage(secret_key))

    # routes.setup_routes(app)
    abandon.setup_routes(app)

    app.add_routes([web.static('/static','./static',show_index=True)])

    return app

def main():

    # logging.basicConfig(level=logging.DEBUG)
    loop = asyncio.get_event_loop()
    app = init(loop)

    web.run_app(app, host='0.0.0.0', port=8080)

if __name__ == '__main__':
    main()
