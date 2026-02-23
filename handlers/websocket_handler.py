import json
import tornado.websocket

import state # імпорт глобального стану для зберігання клієнтів та останніх даних
# state - це окремий модуль, який містить змінні для зберігання стану додатку

class CryptoWebSocket(tornado.websocket.WebSocketHandler):
    def open(self):
        state.clients.add(self)
        print("Клієнт підключився")
        if state.latest_data:
            self.write_message(json.dumps(state.latest_data)) # відправка свіжих даних новому клієнту

    def on_close(self):
        state.clients.discard(self)
        print("Клієнт від'єднався")
