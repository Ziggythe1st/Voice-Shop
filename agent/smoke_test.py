import asyncio, os
os.environ.setdefault("SHOP_BASE_URL", "http://localhost:3000")
from main import SalesAgent  # assumes agent/main.py defines SalesAgent

async def run():
    ag = SalesAgent()

    # list/search
    lp = await ag.list_products(None, query="keyboard")
    print("list_products ->", [p["id"] for p in lp.get("products", [])])

    # create cart
    cart = await ag.create_cart(None)
    cid = cart["id"]
    print("create_cart ->", cid)

    # add item
    products = lp.get("products", [])
    if products:
        pid = products[0]["id"]
        added = await ag.add_to_cart(None, productId=pid, quantity=2)
        print("add_to_cart ->", added.get("items"))

    # promos
    promos = await ag.list_promotions(None)
    print("list_promotions ->", promos)

    # checkout
    order = await ag.checkout_cart(None, promoCode="WELCOME10")
    print("checkout_cart ->", order["id"], order["total"])

    # track
    tracked = await ag.track_order(None, orderId=order["id"])
    print("track_order ->", tracked["status"], tracked["etaDays"])

if __name__ == "__main__":
    asyncio.run(run())
