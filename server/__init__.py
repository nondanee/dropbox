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


@asyncio.coroutine
def init(loop=None):
    app = web.Application(loop=loop)
    app.on_startup.append(create_pool)

    app["working_dir"] = str(working_directory)
    app["temp_dir"] = str(working_directory/"temp")

    # fernet_key = fernet.Fernet.generate_key()
    fernet_key = b'wAYavr8zyR2kvmf1uXGko4MdGJ8cpDFOUW0lHIxoQ-I='
    secret_key = base64.urlsafe_b64decode(fernet_key)

    setup(app, EncryptedCookieStorage(secret_key,max_age=1296000))

    routes.setup_routes(app)

    return app

def main():

    # logging.basicConfig(level=logging.DEBUG)
    loop = asyncio.get_event_loop()
    app = init(loop)

    web.run_app(app, host = config.get("server", "host"), port = config.getint("server", "port"))

if __name__ == '__main__':
    main()
