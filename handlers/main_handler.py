import tornado.web


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html")


# при бажанні можна додати інші методи (post, put, delete) для обробки відповідних HTTP-запитів