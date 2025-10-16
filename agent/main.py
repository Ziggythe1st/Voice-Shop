import os, glob, json, requests
from dotenv import load_dotenv
load_dotenv()

from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, function_tool, RunContext, cli
from livekit.plugins import openai, cartesia, silero

SHOP_BASE = os.getenv("SHOP_BASE_URL", "http://localhost:3000")

def _get(path: str, params=None):
    r = requests.get(f"{SHOP_BASE}{path}", params=params, timeout=10); r.raise_for_status(); return r.json()

def _post(path: str, body=None):
    r = requests.post(f"{SHOP_BASE}{path}", json=body or {}, timeout=10); r.raise_for_status(); return r.json()

def load_context(dir_path: str):
    docs = []
    if not os.path.isdir(dir_path):
        return docs
    for path in glob.glob(os.path.join(dir_path, "**", "*"), recursive=True):
        if os.path.isdir(path):
            continue
        title = os.path.basename(path)
        ext = os.path.splitext(path)[1].lower()
        try:
            if ext in [".md", ".txt"]:
                with open(path, "r", encoding="utf-8") as f:
                    docs.append({"id": path, "title": title, "text": f.read()})
            elif ext == ".json":
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if isinstance(data, list):
                    for item in data:
                        text = json.dumps(item, ensure_ascii=False)
                        docs.append({"id": item.get("id", path), "title": item.get("name", title), "text": text})
                else:
                    docs.append({"id": path, "title": title, "text": json.dumps(data, ensure_ascii=False)})
        except Exception as e:
            print(f"[context] skip {path}: {e}")
    return docs

def simple_search(docs, query: str, k: int = 5):
    q = [w for w in query.lower().split() if w]
    scored = []
    for d in docs:
        text = d["text"].lower()
        score = sum(text.count(w) for w in q)
        if score > 0:
            scored.append((score, d))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [d for _, d in scored[:k]]

class SalesAgent(Agent):
    """
    Voice sales agent that ONLY uses data from the shop tools.
    Keep answers short (1–2 sentences) and confirm before checkout.
    """
    def __init__(self):
        # Cerebras via OpenAI-compatible plugin; Cartesia STT/TTS; Silero VAD
        llm = openai.LLM.with_cerebras(model="llama-3.3-70b")   # requires CEREBRAS_API_KEY env
        stt = cartesia.STT()                                    # requires CARTESIA_API_KEY env
        tts = cartesia.TTS()
        vad = silero.VAD.load()
        super().__init__(
            instructions=(
  "You are a helpful voice shopping assistant for Voice Shop.\n"
    "\n"
    "TOOL ROUTING:\n"
    "- Use REST tools for all facts and transactions:\n"
    "  list_products (browse/search), get_product (a specific item),\n"
    "  create_cart / add_to_cart (manage cart), checkout_cart (place order),\n"
    "  track_order (order status), list_promotions (available promo codes).\n"
    "- Use search_context ONLY for sales copy, FAQs, policies, comparisons, or recommendations.\n"
    "- Never state price, stock, totals, or order status without first calling the appropriate REST tool.\n"
    "\n"
    "FLOW RULES:\n"
    "1) Browsing: If the user asks what's available or for a category/keyword, call list_products with query.\n"
    "2) Details: If they ask about a specific item, call get_product with its id.\n"
    "3) Cart: If they say 'add X' and no cart exists, call create_cart, then add_to_cart.\n"
    "4) Promos: Before checkout, call list_promotions and offer any that apply if the user is interested.\n"
    "5) Checkout: Summarize the items and final total, then ask for explicit confirmation.\n"
    "   Only if the user says 'confirm' (or equivalent) call checkout_cart (include promoCode if provided).\n"
    "6) Orders: For delivery/ETA, call track_order.\n"
    "\n"
    "BEHAVIOR:\n"
    "- Keep voice responses concise (1–3 sentences).\n"
    "- Ask a short clarifying question if required info is missing (e.g., which product or quantity).\n"
    "- If a tool returns an error or a product/id is not found, apologize and offer alternatives via list_products.\n"
    "- Do not invent product IDs, prices, or stock. Cite the tool result in your own words.\n"
    "- Maintain a single cart per conversation; reuse the same cartId.\n"
     "CALL LIMITS (IMPORTANT):\n"
  "- For each user turn, call AT MOST ONE tool, then answer briefly (1–3 sentences).\n"
  "- Prefer the 'query' parameter for product search; do not send both 'category' and 'query'.\n"
            ),
            stt=stt, llm=llm, tts=tts, vad=vad
        )
        # FIXED indent below:
        ctx_dir = os.getenv("CONTEXT_DIR", os.path.join(os.path.dirname(__file__), "context"))
        self.context_docs = load_context(ctx_dir)
        self.cart_id = None

    async def on_enter(self):
        # Greet on join, like the tutorial flow
        await self.session.generate_reply(user_input="Say a short friendly greeting and offer help.")

    @function_tool()
    async def list_products(self, ctx: RunContext, query: str | None = None, category: str | None = None) -> dict:
        q = (query or "").strip()
        return _get("/api/products", {"q": q} if q else None)

    @function_tool()
    async def get_product(self, ctx: RunContext, productId: str) -> dict:
        return _get(f"/api/products/{productId}")

    @function_tool()
    async def create_cart(self, ctx: RunContext) -> dict:
        data = _post("/api/cart")
        self.cart_id = data["id"]
        return data

    @function_tool()
    async def add_to_cart(self, ctx: RunContext, productId: str, quantity: int = 1) -> dict:
        if not self.cart_id:
            self.cart_id = _post("/api/cart")["id"]
        return _post(f"/api/cart/{self.cart_id}/items", {"productId": productId, "quantity": max(1, int(quantity))})

    @function_tool()
    async def checkout_cart(self, ctx: RunContext, promoCode: str | None = None) -> dict:
        if not self.cart_id:
            return {"error": "No cart yet"}
        body = {"promoCode": promoCode} if promoCode else {}
        return _post(f"/api/cart/{self.cart_id}/checkout", body)

    @function_tool()
    async def track_order(self, ctx: RunContext, orderId: str) -> dict:
        return _get(f"/api/orders/{orderId}")

    @function_tool()
    async def list_promotions(self, ctx: RunContext) -> dict:
        return _get("/api/promos")

    # FIXED indent on decorator & method below:
    @function_tool()
    async def search_context(self, ctx: RunContext, query: str, k: int = 5) -> dict:
        """Search reference docs (products.json, policies.md) for sales info."""
        return {"results": simple_search(self.context_docs, query, k)}

async def entrypoint(ctx: JobContext):
    await ctx.connect()
    agent = SalesAgent()
    session = AgentSession()
    await session.start(room=ctx.room, agent=agent)


if __name__ == "__main__":
    # Start a LiveKit worker from the terminal
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
