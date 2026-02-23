import os
import tornado.ioloop
import tornado.web
import asyncio
import webbrowser

from handlers.main_handler import MainHandler
from handlers.websocket_handler import CryptoWebSocket
from services.crypto_service import fetch_crypto_data, start_periodic_fetch

def make_app():
    return tornado.web.Application(
        [
            (r"/",    MainHandler),
            (r"/ws",  CryptoWebSocket),
            (r"/static/(.*)", tornado.web.StaticFileHandler, {"path": "static"}),
        ],
        template_path=os.path.join(os.path.dirname(__file__), "templates"),
        static_path=os.path.join(os.path.dirname(__file__), "static"), 
    )


if __name__ == "__main__":
    app = make_app()
    app.listen(8888)

    start_periodic_fetch()
    asyncio.ensure_future(fetch_crypto_data())

    print("Сервер запущено на http://localhost:8888")
    webbrowser.open("http://localhost:8888")

    tornado.ioloop.IOLoop.current().start()