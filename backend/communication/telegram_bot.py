"""
Telegram Bot Controller (no external SDK)

We use Telegram Bot API directly via httpx to avoid dependency conflicts.

- Runs long-polling in-process (no webhook required)
- Sends alerts to a configured chat
- Supports basic commands: /status, /check <token_address>, /help
- Supports inline buttons: More Info, Ignore
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Awaitable, Callable, Optional

import httpx

from core.config import settings
from utils.logger import get_logger

logger = get_logger("telegram")

StatusProvider = Callable[[], str]
CheckProvider = Callable[[str], Awaitable[str]]


@dataclass
class TelegramBotConfig:
    token: str
    chat_id: str


class TelegramBotController:
    def __init__(
        self,
        config: TelegramBotConfig,
        status_provider: StatusProvider,
        check_provider: CheckProvider,
    ):
        self.config = config
        self._status_provider = status_provider
        self._check_provider = check_provider

        self._client: Optional[httpx.AsyncClient] = None
        self._task: Optional[asyncio.Task] = None
        self._running = False
        self._update_offset: int = 0

    @property
    def is_configured(self) -> bool:
        return bool(self.config.token and self.config.chat_id)

    @property
    def _base_url(self) -> str:
        return f"https://api.telegram.org/bot{self.config.token}"

    async def start(self) -> None:
        if self._running or not self.is_configured:
            return
        self._client = httpx.AsyncClient(timeout=40.0)
        self._running = True
        self._task = asyncio.create_task(self._poll_loop())
        logger.info("Telegram long-polling started")
        try:
            await self.send_message("✅ SolanaHunter connected. Send /status or /check <token_address>.")
        except Exception as e:
            logger.warning(f"Telegram ready message failed: {e}")

    async def stop(self) -> None:
        if not self._running:
            return
        self._running = False
        if self._task:
            self._task.cancel()
        if self._client:
            await self._client.aclose()
        self._task = None
        self._client = None
        logger.info("Telegram stopped")

    async def send_message(
        self,
        text: str,
        *,
        parse_mode: Optional[str] = None,
        reply_markup: Optional[dict] = None,
        disable_web_page_preview: bool = True,
    ) -> None:
        client = self._client or httpx.AsyncClient(timeout=30.0)
        try:
            payload = {
                "chat_id": self.config.chat_id,
                "text": text,
                "disable_web_page_preview": disable_web_page_preview,
            }
            if parse_mode:
                payload["parse_mode"] = parse_mode
            if reply_markup:
                payload["reply_markup"] = reply_markup
            r = await client.post(f"{self._base_url}/sendMessage", json=payload)
            r.raise_for_status()
        finally:
            if client is not self._client:
                await client.aclose()

    async def edit_message_text(
        self,
        *,
        chat_id: str,
        message_id: int,
        text: str,
        parse_mode: Optional[str] = None,
        disable_web_page_preview: bool = True,
    ) -> None:
        if not self._client:
            return
        payload = {
            "chat_id": chat_id,
            "message_id": message_id,
            "text": text,
            "disable_web_page_preview": disable_web_page_preview,
        }
        if parse_mode:
            payload["parse_mode"] = parse_mode
        r = await self._client.post(f"{self._base_url}/editMessageText", json=payload)
        r.raise_for_status()

    async def answer_callback_query(self, callback_query_id: str) -> None:
        if not self._client:
            return
        payload = {"callback_query_id": callback_query_id}
        r = await self._client.post(f"{self._base_url}/answerCallbackQuery", json=payload)
        r.raise_for_status()

    async def send_alert(self, token: dict) -> None:
        symbol = token.get("symbol", "N/A")
        address = token.get("address", "")
        final_score = token.get("final_score", 0)
        grade = token.get("grade", "N/A")
        safety_score = token.get("safety_score", 0)
        holders = token.get("holder_count", 0)
        smart_money = token.get("smart_money_count", 0)

        text = (
            f"🚨 *HIGH SCORE TOKEN*\n\n"
            f"*Token:* `{symbol}`\n"
            f"*Score:* *{final_score}/100* ({grade})\n\n"
            f"✅ Safety: {safety_score}/100\n"
            f"✅ Holders: {holders}\n"
            f"✅ Smart Money: {smart_money}\n\n"
            f"*Address:*\n`{address}`\n\n"
            f"[DexScreener](https://dexscreener.com/solana/{address})"
        )

        reply_markup = {
            "inline_keyboard": [
                [
                    {"text": "📊 More Info", "callback_data": f"info:{address}"},
                    {"text": "❌ Ignore", "callback_data": "ignore"},
                ]
            ]
        }

        await self.send_message(text, parse_mode="Markdown", reply_markup=reply_markup)

    async def _poll_loop(self) -> None:
        assert self._client is not None
        while self._running:
            try:
                params = {
                    "timeout": 35,
                    "offset": self._update_offset,
                    "allowed_updates": ["message", "callback_query"],
                }
                r = await self._client.get(f"{self._base_url}/getUpdates", params=params)
                r.raise_for_status()
                updates = r.json().get("result", [])
                for upd in updates:
                    self._update_offset = max(self._update_offset, int(upd.get("update_id", 0)) + 1)
                    await self._handle_update(upd)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warning(f"Telegram polling error: {e}")
                await asyncio.sleep(2)

    async def _handle_update(self, upd: dict) -> None:
        # Callback query (button click)
        if "callback_query" in upd:
            cq = upd["callback_query"]
            cq_id = cq.get("id", "")
            data = cq.get("data", "")
            message = cq.get("message", {}) or {}
            chat = message.get("chat", {}) or {}
            chat_id = str(chat.get("id", ""))
            message_id = message.get("message_id")

            if cq_id:
                await self.answer_callback_query(cq_id)

            if data == "ignore" and chat_id and isinstance(message_id, int):
                await self.edit_message_text(chat_id=chat_id, message_id=message_id, text="✅ Ignored.")
                return

            if data.startswith("info:") and chat_id and isinstance(message_id, int):
                addr = data.split("info:", 1)[1]
                text = (
                    f"📊 *More Info*\n\n"
                    f"`{addr}`\n"
                    f"[DexScreener](https://dexscreener.com/solana/{addr})\n"
                    f"[Solscan](https://solscan.io/token/{addr})"
                )
                await self.edit_message_text(chat_id=chat_id, message_id=message_id, text=text, parse_mode="Markdown")
                return
            return

        # Message
        msg = upd.get("message") or {}
        text = (msg.get("text") or "").strip()
        chat = msg.get("chat") or {}
        chat_id = str(chat.get("id") or "")

        # Only respond to configured chat (owner)
        if chat_id and self.config.chat_id and chat_id != str(self.config.chat_id):
            return

        if not text:
            return

        if text in ("/help", "help"):
            await self.send_message(
                "🤖 *SolanaHunter Commands*\n\n"
                "/status - bot status\n"
                "/check <token_address> - analyze a token now\n"
                "/help - this message",
                parse_mode="Markdown",
            )
            return

        if text in ("/status", "status"):
            try:
                status = self._status_provider()
            except Exception as e:
                status = f"Status unavailable: {e}"
            await self.send_message(status)
            return

        if text.startswith("/check") or text.lower().startswith("check "):
            parts = text.split()
            if len(parts) < 2:
                await self.send_message("Usage: /check <token_address>")
                return
            token_address = parts[1].strip()
            await self.send_message("🔍 Checking token... please wait.")
            try:
                result = await self._check_provider(token_address)
            except Exception as e:
                result = f"❌ Check failed: {e}"
            await self.send_message(result, parse_mode="Markdown")
            return

        await self.send_message("Send /help for commands.")


def build_telegram_controller(
    status_provider: StatusProvider,
    check_provider: CheckProvider,
) -> Optional[TelegramBotController]:
    if not settings.telegram_bot_token or not settings.telegram_chat_id:
        return None
    cfg = TelegramBotConfig(token=settings.telegram_bot_token, chat_id=settings.telegram_chat_id)
    return TelegramBotController(cfg, status_provider=status_provider, check_provider=check_provider)

