import json
import tornado.httpclient
import tornado.ioloop

import state

API_URL = (
    "https://api.coingecko.com/api/v3/coins/markets"
    "?vs_currency=usd"
    "&order=market_cap_desc"
    "&per_page=30"
    "&page=1"
    "&price_change_percentage=1h,24h,7d"
    "&sparkline=false"
)

REFRESH_INTERVAL_MS = 30_000 # 30 секунд


async def fetch_crypto_data():
    http_client = tornado.httpclient.AsyncHTTPClient()
    try:
        request = tornado.httpclient.HTTPRequest(
            API_URL,
            headers={
                "User-Agent": "TornadoCryptoApp/1.0",
                "Accept":     "application/json",
            },
            request_timeout=10, # таймаут для запиту, щоб уникнути зависання при проблемах з мережею або API
        )
        response = await http_client.fetch(request)

        if response.code == 200:
            raw = json.loads(response.body)
            processed = [
                {
                    "rank":          i + 1,
                    "name":          coin.get("name", "N/A"),
                    "symbol":        coin.get("symbol", "N/A").upper(),
                    "image":         coin.get("image", ""),
                    "current_price": coin.get("current_price", 0),
                    "market_cap":    coin.get("market_cap", 0),
                    "change_1h":     coin.get("price_change_percentage_1h_in_currency",  0) or 0,
                    "change_24h":    coin.get("price_change_percentage_24h_in_currency", 0) or 0,
                    "change_7d":     coin.get("price_change_percentage_7d_in_currency",  0) or 0,
                    "volume":        coin.get("total_volume", 0),
                }
                for i, coin in enumerate(raw)
            ]

            if processed:
                state.latest_data = processed
                print(f"[CoinGecko] Оновлено: {len(processed)} монет")
                message = json.dumps(processed)
                for client in list(state.clients):
                    try:
                        client.write_message(message)
                    except Exception:
                        state.clients.discard(client)
        else:
            print(f"[CoinGecko] HTTP статус: {response.code}")

    except Exception as e:
        print(f"[CoinGecko] Помилка: {e}")


def start_periodic_fetch():
    tornado.ioloop.PeriodicCallback(fetch_crypto_data, REFRESH_INTERVAL_MS).start()
