"""
Telegram Bot Controller (no external SDK)

📋 מה הקובץ הזה עושה:
-------------------
זה הקובץ שמנהל את כל התקשורת עם טלגרם.

הקובץ הזה:
1. מתחבר לטלגרם Bot API (ללא SDK חיצוני - ישירות דרך httpx)
2. מריץ long-polling (מאזין להודעות נכנסות)
3. שולח התראות אוטומטיות על טוקנים טובים
4. מטפל בכל הפקודות מהמשתמש

🔧 כל הפקודות שמוגדרות כאן:
-------------------
פקודות בסיסיות:
- /start, /menu, /help - תפריט ראשי
- /status - מצב הבוט
- /check <address> - בדיקת טוקן
- /top [N] - טופ N טוקנים
- /scan - סריקה מיידית
- /stats - סטטיסטיקות
- /alerts - מצב התראות
- /mute [זמן] - השתקת התראות
- /unmute - ביטול השתקה

פקודות ניהול:
- /threshold [N] - שינוי סף התראה (0-100)
- /mode [quiet/normal] - שינוי מצב עבודה
- /stop - השהת הבוט
- /resume - חידוש הבוט

פקודות היסטוריה וחיפוש:
- /lastalert - התראה אחרונה
- /history [N] - היסטוריית התראות (N אחרונות)
- /search <symbol> - חיפוש לפי סימבול

פקודות מעקב ומועדפים:
- /watch <address> - מעקב אחרי טוקן
- /watched - רשימת טוקנים במעקב
- /unwatch <address> - הסרת מעקב
- /favorites - רשימת מועדפים
- /fav <address> - הוספה למועדפים
- /unfav <address> - הסרה ממועדפים

פקודות ניתוח:
- /compare <addr1> <addr2> - השוואה בין 2 טוקנים
- /trends - טרנדים (טופ 5)
- /filter - הגדרת פילטרים מותאמים
- /export - ייצוא נתונים (JSON)

💡 איך זה עובד:
1. יוצר long-polling loop שמאזין להודעות
2. כל הודעה נשלחת ל-_handle_update
3. הפונקציה מזהה את הפקודה ומפעילה את ה-provider המתאים
4. התראות נשלחות אוטומטית כשבוט מוצא טוקן טוב

📝 הערות טכניות:
- לא משתמש ב-python-telegram-bot SDK (קונפליקטים ב-dependencies)
- משתמש ב-Telegram Bot API ישירות דרך httpx
- היסטוריית התראות נשמרת בזיכרון (max 100)
- כל הפקודות תומכות בעברית ואנגלית
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import html
import re
from typing import Awaitable, Callable, Optional

import httpx
from httpx import HTTPStatusError

from core.config import settings
from utils.logger import get_logger

logger = get_logger("telegram")

StatusProvider = Callable[[], Awaitable[str]]  # Changed to async for wallet balance
CheckProvider = Callable[[str], Awaitable[str]]
TopProvider = Callable[[int], str]
ScanNowProvider = Callable[[], Awaitable[str]]
SetThresholdProvider = Callable[[int], str]
GetThresholdProvider = Callable[[], int]
SetModeProvider = Callable[[str], str]
GetModeProvider = Callable[[], str]
PauseProvider = Callable[[], str]
ResumeProvider = Callable[[], str]
StatsProvider = Callable[[], str]
LastAlertProvider = Callable[[], Optional[dict]]
HistoryProvider = Callable[[int], list[dict]]
SearchProvider = Callable[[str], Awaitable[list[dict]]]
WatchProvider = Callable[[str], str]
UnwatchProvider = Callable[[str], str]
ListWatchedProvider = Callable[[], list[str]]
CompareProvider = Callable[[str, str], Awaitable[str]]
FavoritesProvider = Callable[[], list[dict]]
AddFavoriteProvider = Callable[[str], str]
RemoveFavoriteProvider = Callable[[str], str]
ExportProvider = Callable[[], str]
FilterProvider = Callable[[dict], str]
GetFiltersProvider = Callable[[], dict]
TrendsProvider = Callable[[], str]
BuyProvider = Callable[[str, float], Awaitable[str]]  # token_mint, amount_sol
SellProvider = Callable[[str], Awaitable[str]]  # token_mint
PortfolioProvider = Callable[[], Awaitable[str]]  # portfolio status
ProfitProvider = Callable[[], Awaitable[str]]  # profit stats
WithdrawProvider = Callable[[Optional[float]], Awaitable[str]]  # withdraw amount (optional)


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
        top_provider: Optional[TopProvider] = None,
        scan_now_provider: Optional[ScanNowProvider] = None,
        set_threshold_provider: Optional[SetThresholdProvider] = None,
        get_threshold_provider: Optional[GetThresholdProvider] = None,
        set_mode_provider: Optional[SetModeProvider] = None,
        get_mode_provider: Optional[GetModeProvider] = None,
        pause_provider: Optional[PauseProvider] = None,
        resume_provider: Optional[ResumeProvider] = None,
        stats_provider: Optional[StatsProvider] = None,
        last_alert_provider: Optional[LastAlertProvider] = None,
        history_provider: Optional[HistoryProvider] = None,
        search_provider: Optional[SearchProvider] = None,
        watch_provider: Optional[WatchProvider] = None,
        unwatch_provider: Optional[UnwatchProvider] = None,
        list_watched_provider: Optional[ListWatchedProvider] = None,
        compare_provider: Optional[CompareProvider] = None,
        favorites_provider: Optional[FavoritesProvider] = None,
        add_favorite_provider: Optional[AddFavoriteProvider] = None,
        remove_favorite_provider: Optional[RemoveFavoriteProvider] = None,
        export_provider: Optional[ExportProvider] = None,
        filter_provider: Optional[FilterProvider] = None,
        get_filters_provider: Optional[GetFiltersProvider] = None,
        trends_provider: Optional[TrendsProvider] = None,
        buy_provider: Optional[BuyProvider] = None,
        sell_provider: Optional[SellProvider] = None,
        portfolio_provider: Optional[PortfolioProvider] = None,
        profit_provider: Optional[ProfitProvider] = None,
        withdraw_provider: Optional[WithdrawProvider] = None,
    ):
        self.config = config
        self._status_provider = status_provider
        self._check_provider = check_provider
        self._top_provider = top_provider
        self._scan_now_provider = scan_now_provider
        self._set_threshold_provider = set_threshold_provider
        self._get_threshold_provider = get_threshold_provider
        self._set_mode_provider = set_mode_provider
        self._get_mode_provider = get_mode_provider
        self._pause_provider = pause_provider
        self._resume_provider = resume_provider
        self._stats_provider = stats_provider
        self._last_alert_provider = last_alert_provider
        self._history_provider = history_provider
        self._search_provider = search_provider
        self._watch_provider = watch_provider
        self._unwatch_provider = unwatch_provider
        self._list_watched_provider = list_watched_provider
        self._compare_provider = compare_provider
        self._favorites_provider = favorites_provider
        self._add_favorite_provider = add_favorite_provider
        self._remove_favorite_provider = remove_favorite_provider
        self._export_provider = export_provider
        self._filter_provider = filter_provider
        self._get_filters_provider = get_filters_provider
        self._trends_provider = trends_provider
        self._buy_provider = buy_provider
        self._sell_provider = sell_provider
        self._portfolio_provider = portfolio_provider
        self._profit_provider = profit_provider
        self._withdraw_provider = withdraw_provider

        self._client: Optional[httpx.AsyncClient] = None
        self._task: Optional[asyncio.Task] = None
        self._running = False
        self._update_offset: int = 0
        self._mute_until: Optional[datetime] = None
        self._alerts_sent_count: int = 0
        self._alert_history: list[dict] = []  # היסטוריית התראות (max 100)
        self._max_history_size: int = 100

    @property
    def is_configured(self) -> bool:
        return bool(self.config.token and self.config.chat_id)

    @property
    def _base_url(self) -> str:
        return f"https://api.telegram.org/bot{self.config.token}"

    async def start(self) -> None:
        """
        🚀 הפעלת הבוט טלגרם
        מתחיל את long-polling loop שמאזין להודעות נכנסות
        ושולח תפריט ראשי למשתמש
        """
        if self._running or not self.is_configured:
            return
        self._client = httpx.AsyncClient(timeout=40.0)
        self._running = True
        self._task = asyncio.create_task(self._poll_loop())  # מריץ את הלולאה ברקע
        logger.info("Telegram long-polling started")
        try:
            await self.send_menu()  # שולח תפריט ראשי
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
        except HTTPStatusError as e:
            logger.error(f"Telegram API error: {e.response.status_code} - {e.response.text}")
            # לא נזרוק שגיאה - רק נרשום בלוג (לא רוצים לשבור את הבוט)
        except Exception as e:
            logger.error(f"Failed to send Telegram message: {e}")
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
        """
        🚨 שליחת התראה על טוקן טוב
        שולח הודעה מעוצבת עם כל הפרטים + כפתורים לפעולות מהירות
        """
        if self.is_muted:  # אם מושתק - לא שולח כלום
            return
        symbol = token.get("symbol", "N/A")
        address = token.get("address", "")
        final_score = token.get("final_score", 0)
        grade = token.get("grade", "N/A")
        safety_score = token.get("safety_score", 0)
        holders = token.get("holder_count", 0)
        smart_money = token.get("smart_money_count", 0)
        ownership_renounced = token.get("ownership_renounced", False)
        liquidity_locked = token.get("liquidity_locked", False)
        top_10_pct = token.get("top_10_percentage", 0)

        symbol_e = self._e(symbol)
        addr_e = self._e(address)
        dex_url = f"https://dexscreener.com/solana/{address}"
        solscan_url = f"https://solscan.io/token/{address}"

        # Risk assessment
        risk_level = "🟢 נמוך" if final_score >= 90 else "🟡 בינוני" if final_score >= 85 else "🟠 גבוה"
        
        # Key strengths
        strengths = []
        if ownership_renounced:
            strengths.append("✅ Ownership renounced")
        if liquidity_locked:
            strengths.append("✅ Liquidity locked")
        if smart_money > 0:
            strengths.append(f"✅ {smart_money} Smart Money wallets")
        if holders > 1000:
            strengths.append(f"✅ {holders} holders")
        if top_10_pct < 50:
            strengths.append("✅ Decentralized distribution")
        
        strengths_text = "\n".join(strengths) if strengths else "⚠️ בדוק בזהירות"

        text = (
            "🚨 <b>וואו! מצאתי משהו שווה!</b>\n\n"
            f"<b>טוקן:</b> <code>{symbol_e}</code>\n"
            f"<b>ציון:</b> <b>{final_score}/100</b> ({self._e(str(grade))}) 🔥\n"
            f"<b>רמת סיכון:</b> {risk_level}\n\n"
            f"<b>📊 הפרטים:</b>\n"
            f"• בטיחות: {safety_score}/100\n"
            f"• מחזיקים: {holders}\n"
            f"• Smart Money: {smart_money}\n"
            f"• Top 10%: {top_10_pct:.1f}%\n\n"
            f"<b>✅ מה טוב בו:</b>\n{strengths_text}\n\n"
            f"<b>כתובת:</b>\n<code>{addr_e}</code>\n\n"
            f"<a href=\"{self._e(dex_url)}\">📊 DexScreener</a> | "
            f"<a href=\"{self._e(solscan_url)}\">🔍 Solscan</a>"
        )

        # כפתורים - כולל Buy אם יש buy_provider
        inline_keyboard = [
            [
                {"text": "📊 More Info", "callback_data": f"info:{address}"},
                {"text": "🔍 Check Again", "callback_data": f"check:{address}"},
            ],
        ]
        
        # הוסף כפתור Buy אם יש buy_provider
        if self._buy_provider:
            inline_keyboard[0].insert(0, {"text": "💰 Buy", "callback_data": f"buy:{address}"})
        
        inline_keyboard.append([
            {"text": "❌ Ignore", "callback_data": "ignore"},
        ])
        
        reply_markup = {
            "inline_keyboard": inline_keyboard
        }

        await self.send_message(text, parse_mode="HTML", reply_markup=reply_markup)
        self._alerts_sent_count += 1
        
        # שמור בהיסטוריה
        alert_record = {
            "timestamp": datetime.now(timezone.utc),
            "token": token,
            "symbol": symbol,
            "address": address,
            "score": final_score,
            "grade": grade,
        }
        self._alert_history.append(alert_record)
        # שמור רק N האחרונות
        if len(self._alert_history) > self._max_history_size:
            self._alert_history.pop(0)

    @property
    def is_muted(self) -> bool:
        if not self._mute_until:
            return False
        return datetime.now(timezone.utc) < self._mute_until

    def mute_for(self, duration: timedelta) -> None:
        self._mute_until = datetime.now(timezone.utc) + duration

    def unmute(self) -> None:
        self._mute_until = None

    @staticmethod
    def _e(s: str) -> str:
        return html.escape(s or "")

    @staticmethod
    def _parse_duration(text: str) -> Optional[timedelta]:
        """
        Parse durations like: 10m, 2h, 1d
        Also supports Hebrew: "10ד", "30 דקות", "2 שעות", "1 יום"
        """
        t = text.strip().lower()
        m = re.fullmatch(r"(\d{1,4})\s*([mhd])", t)
        if m:
            value = int(m.group(1))
            unit = m.group(2)
            return (
                timedelta(minutes=value)
                if unit == "m"
                else timedelta(hours=value)
                if unit == "h"
                else timedelta(days=value)
            )

        m = re.fullmatch(r"(\d{1,4})\s*(ד|דק|דקות|דקה)", t)
        if m:
            return timedelta(minutes=int(m.group(1)))
        m = re.fullmatch(r"(\d{1,4})\s*(ש|שעה|שעות)", t)
        if m:
            return timedelta(hours=int(m.group(1)))
        m = re.fullmatch(r"(\d{1,4})\s*(י|יום|ימים)", t)
        if m:
            return timedelta(days=int(m.group(1)))

        return None

    async def send_menu(self) -> None:
        """
        Main menu + keyboard (Hebrew) - תפריט ראשי מקצועי.
        """
        mode = self._get_mode_provider() if self._get_mode_provider else "normal"
        thr = self._get_threshold_provider() if self._get_threshold_provider else 85
        
        keyboard = {
            "keyboard": [
                [{"text": "📊 סטטוס"}, {"text": "🏆 טופ"}, {"text": "📈 סטטיסטיקות"}],
                [{"text": "🔔 התראות"}, {"text": "⚙️ הגדרות"}, {"text": "▶️ סרוק עכשיו"}],
                [{"text": "🔕 השתק 30ד"}, {"text": "🆘 עזרה"}, {"text": "📋 תפריט"}],
            ],
            "resize_keyboard": True,
            "one_time_keyboard": False,
        }

        msg = (
            "<b>🤖 מה קורה אחי!</b>\n\n"
            "<b>🔥 פקודות מהירות:</b>\n"
            "• <b>סטטוס</b> — איך אני עובד\n"
            "• <b>טופ</b> — הטוקנים הכי שווים\n"
            "• <b>סטטיסטיקות</b> — כל הנתונים\n"
            "• <b>בדיקה</b> — שלח: <code>בדוק &lt;כתובת טוקן&gt;</code>\n"
            "• <b>התראות</b> — מה קורה עם ההתראות\n"
            "• <b>הגדרות</b> — תכונות וכל זה\n"
            "• <b>סרוק עכשיו</b> — בוא נחפש משהו חדש\n\n"
            f"<b>⚙️ איך אני עובד כרגע:</b>\n"
            f"• מצב: <code>{self._e(mode)}</code>\n"
            f"• סף התראה: <code>{thr}</code>\n\n"
            "<b>🔧 פקודות מתקדמות:</b>\n"
            "• <code>/status</code> — מה המצב\n"
            "• <code>/check &lt;address&gt;</code> — בוא נבדוק טוקן\n"
            "• <code>/top [N]</code> — הטופ N\n"
            "• <code>/scan</code> — בוא נסרוק\n"
            "• <code>/threshold [N]</code> — שינוי סף\n"
            "• <code>/mode [quiet/normal]</code> — שינוי מצב\n"
            "• <code>/stop</code> / <code>/resume</code> — עצור/המשך\n"
            "• <code>/stats</code> — סטטיסטיקות\n"
            "• <code>/mute [זמן]</code> / <code>/unmute</code> — השתק/הפעל\n\n"
            "<b>📜 היסטוריה וחיפוש:</b>\n"
            "• <code>/lastalert</code> — התראה אחרונה\n"
            "• <code>/history [N]</code> — מה היה\n"
            "• <code>/search &lt;symbol&gt;</code> — בוא נחפש\n\n"
            "<b>👁️ מעקב ומועדפים:</b>\n"
            "• <code>/watch &lt;address&gt;</code> — בוא נעקוב\n"
            "• <code>/watched</code> — מה אנחנו עוקבים\n"
            "• <code>/unwatch &lt;address&gt;</code> — תפסיק לעקוב\n"
            "• <code>/favorites</code> — המועדפים שלך\n"
            "• <code>/fav &lt;address&gt;</code> — הוסף למועדפים\n"
            "• <code>/unfav &lt;address&gt;</code> — הסר ממועדפים\n\n"
            "<b>📊 ניתוח והשוואה:</b>\n"
            "• <code>/compare &lt;addr1&gt; &lt;addr2&gt;</code> — בוא נשווה\n"
            "• <code>/trends</code> — מה הטרנדים\n"
            "• <code>/filter</code> — הגדר פילטרים\n"
            "• <code>/export</code> — ייצא נתונים\n\n"
            "• <code>/help</code> — עזרה\n\n"
            "<i>💡 טיפ: כתוב בעברית או באנגלית, אני מבין הכל!</i>"
        )

        await self.send_message(msg, parse_mode="HTML", reply_markup=keyboard)

    async def _poll_loop(self) -> None:
        """
        🔄 הלולאה הראשית - מאזינה להודעות נכנסות
        כל 35 שניות בודקת אם יש הודעות חדשות מטלגרם
        ומעבירה אותן ל-_handle_update לטיפול
        """
        assert self._client is not None
        while self._running:
            try:
                params = {
                    "timeout": 35,  # ממתין עד 35 שניות להודעות חדשות
                    "offset": self._update_offset,  # offset למניעת כפילויות
                    "allowed_updates": ["message", "callback_query"],  # רק הודעות ולחיצות כפתורים
                }
                r = await self._client.get(f"{self._base_url}/getUpdates", params=params)
                r.raise_for_status()
                updates = r.json().get("result", [])
                for upd in updates:
                    self._update_offset = max(self._update_offset, int(upd.get("update_id", 0)) + 1)
                    await self._handle_update(upd)  # מטפל בכל הודעה
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warning(f"Telegram polling error: {e}")
                await asyncio.sleep(2)

    async def _handle_update(self, upd: dict) -> None:
        """
        📨 טיפול בכל הודעה/לחיצת כפתור שמגיעה מטלגרם
        מזהה את סוג ההודעה (פקודה/הודעה רגילה/לחיצת כפתור)
        ומפעיל את הפונקציה המתאימה
        """
        # לחיצת כפתור (callback query)
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
                dex_url = f"https://dexscreener.com/solana/{addr}"
                solscan_url = f"https://solscan.io/token/{addr}"
                text = (
                    "📊 <b>More Info</b>\n\n"
                    f"<code>{self._e(addr)}</code>\n\n"
                    f"<a href=\"{self._e(dex_url)}\">📊 DexScreener</a> — מחירים וגרפים\n"
                    f"<a href=\"{self._e(solscan_url)}\">🔍 Solscan</a> — ניתוח בלוקצ'יין\n\n"
                    f"💡 השתמש ב-<code>/check {addr}</code> לניתוח מפורט"
                )
                await self.edit_message_text(chat_id=chat_id, message_id=message_id, text=text, parse_mode="HTML")
                return

            if data.startswith("check:") and chat_id and isinstance(message_id, int):
                addr = data.split("check:", 1)[1]
                await self.edit_message_text(
                    chat_id=chat_id,
                    message_id=message_id,
                    text="🔍 בודק את הטוקן… רגע.",
                    parse_mode="HTML"
                )
                try:
                    result = await self._check_provider(addr)
                    await self.edit_message_text(
                        chat_id=chat_id,
                        message_id=message_id,
                        text=result,
                        parse_mode="HTML",
                        disable_web_page_preview=True
                    )
                except Exception as e:
                    await self.edit_message_text(
                        chat_id=chat_id,
                        message_id=message_id,
                        text=f"אופס, הבדיקה נכשלה 😅\n{self._e(str(e))}",
                        parse_mode="HTML"
                    )
                return
            return

        # הודעה רגילה (לא לחיצת כפתור)
        msg = upd.get("message") or {}
        text = (msg.get("text") or "").strip()
        chat = msg.get("chat") or {}
        chat_id = str(chat.get("id") or "")

        # רק מגיב לצ'אט המוגדר (בעלים בלבד) - אבטחה!
        if chat_id and self.config.chat_id and chat_id != str(self.config.chat_id):
            return

        if not text:
            return

        # נרמול טקסט (תמיכה בעברית ואנגלית)
        lower = text.lower()
        normalized = lower.replace("־", "-").replace("–", "-")  # מנרמל מקפים עבריים

        if text in ("/start", "/menu") or normalized in ("תפריט", "menu", "פקודות", "commands", "📋 תפריט"):
            await self.send_menu()
            return

        if text in ("/help", "help", "עזרה", "🆘 עזרה"):
            await self.send_menu()
            return

        if text in ("/status", "status", "סטטוס", "📊 סטטוס"):
            try:
                status = await self._status_provider()  # Now async for wallet balance
            except Exception as e:
                status = f"Status unavailable: {e}"
            await self.send_message(f"<b>📊 מה המצב:</b>\n\n{self._e(status)}", parse_mode="HTML")
            return

        if text in ("/alerts", "alerts", "התראות", "🔔 התראות"):
            muted = "YES" if self.is_muted else "NO"
            until = self._mute_until.isoformat() if self._mute_until else "-"
            muted_he = "כן" if self.is_muted else "לא"
            await self.send_message(
                "<b>🔔 מה קורה עם ההתראות:</b>\n\n"
                f"מושתק: <b>{muted_he}</b>\n"
                f"עד: <code>{self._e(until)}</code>\n"
                f"נשלחו מאז שהתחלתי: <b>{self._alerts_sent_count}</b>",
                parse_mode="HTML",
            )
            return

        if text.startswith("/mute") or normalized.startswith("mute ") or normalized.startswith("השתק "):
            parts = text.split(maxsplit=1)
            if len(parts) < 2:
                await self.send_message("איך להשתמש: <code>/mute 30m</code> או <code>השתק 30ד</code>", parse_mode="HTML")
                return
            dur = self._parse_duration(parts[1].strip())
            if not dur:
                await self.send_message("אופס, זמן לא תקין 😅\nדוגמאות: <code>10ד</code>, <code>2ש</code>, <code>1י</code>, <code>30m</code>", parse_mode="HTML")
                return
            self.mute_for(dur)
            await self.send_message(
                f"🔕 סגור, הושתקתי ל-<b>{self._e(parts[1])}</b>. לא אציק לך 😊",
                parse_mode="HTML",
            )
            return

        if text in ("/unmute", "unmute", "בטל השתקה", "הפעל התראות"):
            self.unmute()
            await self.send_message("🔔 סגור, חזרתי! התראות שוב פעילות 🚀", parse_mode="HTML")
            return

        if text in ("/top", "top", "טופ", "🏆 טופ"):
            if not self._top_provider:
                await self.send_message("<b>אין עדיין סריקה אחרונה.</b>", parse_mode="HTML")
                return
            await self.send_message(self._top_provider(10), parse_mode="HTML", disable_web_page_preview=True)
            return

        # /top N (with number)
        if normalized.startswith("/top ") or normalized.startswith("top "):
            parts = text.split()
            limit = 10
            if len(parts) > 1:
                try:
                    limit = int(parts[1])
                    if limit < 1 or limit > 50:
                        limit = 10
                except Exception:
                    pass
            if not self._top_provider:
                await self.send_message("<b>אין עדיין סריקה אחרונה.</b>", parse_mode="HTML")
                return
            await self.send_message(self._top_provider(limit), parse_mode="HTML", disable_web_page_preview=True)
            return

        if text.startswith("/check") or normalized.startswith("check ") or normalized.startswith("בדוק "):
            parts = text.split(maxsplit=1)
            if len(parts) < 2:
                await self.send_message("איך להשתמש: <code>/check &lt;token_address&gt;</code> או <code>בדוק &lt;כתובת&gt;</code>", parse_mode="HTML")
                return
            token_address = parts[1].strip()
            
            # בדיקת תקינות כתובת בסיסית (Solana address הוא 32-44 תווים)
            if len(token_address) < 32 or len(token_address) > 44:
                await self.send_message(
                    f"אופס, הכתובת לא נראית תקינה 😅\n"
                    f"<code>{self._e(token_address[:20])}…</code>\n"
                    "Solana address צריך להיות 32-44 תווים",
                    parse_mode="HTML"
                )
                return
            
            await self.send_message("🔍 בודק את הטוקן… רגע.", parse_mode="HTML")
            try:
                result = await self._check_provider(token_address)
            except Exception as e:
                logger.error(f"Token check failed: {e}", exc_info=True)
                result = f"אופס, הבדיקה נכשלה 😅\n{self._e(str(e))}"
            await self.send_message(result, parse_mode="HTML", disable_web_page_preview=True)
            return

        # /scan or "סרוק" / "סרוק עכשיו"
        if text in ("/scan", "scan", "סרוק", "סריקה", "▶️ סרוק עכשיו", "סרוק עכשיו"):
            if not self._scan_now_provider:
                await self.send_message("אופס, סריקה מיידית לא זמינה כרגע 😅", parse_mode="HTML")
                return
            await self.send_message("⏳ בוא נסרוק! זה יכול לקחת רגע...", parse_mode="HTML")
            try:
                result = await self._scan_now_provider()
            except Exception as e:
                result = f"אופס, הסריקה נכשלה 😅\n{self._e(str(e))}"
            await self.send_message(result, parse_mode="HTML", disable_web_page_preview=True)
            return

        # /threshold or "סף" / "הגדרות"
        if text.startswith("/threshold") or normalized.startswith("threshold ") or normalized.startswith("סף "):
            if not self._set_threshold_provider or not self._get_threshold_provider:
                await self.send_message("אופס, שינוי סף התראה לא זמין כרגע 😅", parse_mode="HTML")
                return
            parts = text.split()
            if len(parts) == 1:
                await self.send_message(
                    f"סף נוכחי: <code>{self._get_threshold_provider()}</code>\n"
                    "שימוש: <code>/threshold 90</code>",
                    parse_mode="HTML",
                )
                return
            try:
                val = int(parts[1])
                if val < 0 or val > 100:
                    await self.send_message("אופס, הסף חייב להיות בין 0 ל-100 😅", parse_mode="HTML")
                    return
            except Exception:
                await self.send_message("אופס, ערך לא תקין 😅\nדוגמה: <code>/threshold 90</code>", parse_mode="HTML")
                return
            await self.send_message(self._set_threshold_provider(val), parse_mode="HTML")
            return

        # /mode or "מצב"
        if text.startswith("/mode") or normalized.startswith("mode ") or normalized.startswith("מצב "):
            if not self._set_mode_provider or not self._get_mode_provider:
                await self.send_message("אופס, שינוי מצב לא זמין כרגע 😅", parse_mode="HTML")
                return
            parts = text.split()
            if len(parts) == 1:
                await self.send_message(
                    f"מצב נוכחי: <code>{self._e(self._get_mode_provider())}</code>\n"
                    "מצבים: <code>quiet</code>, <code>normal</code>\n"
                    "שימוש: <code>/mode quiet</code>",
                    parse_mode="HTML",
                )
                return
            await self.send_message(self._set_mode_provider(parts[1].strip()), parse_mode="HTML")
            return

        # /stop or "עצור"
        if text in ("/stop", "stop", "עצור", "עצור בוט"):
            if not self._pause_provider:
                await self.send_message("אופס, עצירה לא זמינה כרגע 😅", parse_mode="HTML")
                return
            await self.send_message(self._pause_provider(), parse_mode="HTML")
            return

        # /resume or "המשך"
        if text in ("/resume", "resume", "המשך", "המשך בוט"):
            if not self._resume_provider:
                await self.send_message("אופס, המשך לא זמין כרגע 😅", parse_mode="HTML")
                return
            await self.send_message(self._resume_provider(), parse_mode="HTML")
            return

        # /stats or "סטטיסטיקות"
        if text in ("/stats", "stats", "סטטיסטיקות", "📈 סטטיסטיקות"):
            if not self._stats_provider:
                await self.send_message("אופס, סטטיסטיקות לא זמינות כרגע 😅", parse_mode="HTML")
                return
            try:
                stats = self._stats_provider()
            except Exception as e:
                stats = f"אופס, שגיאה: {self._e(str(e))} 😅"
            await self.send_message(f"<b>📈 סטטיסטיקות</b>\n\n{stats}", parse_mode="HTML")
            return

        # "הגדרות" button
        if normalized in ("⚙️ הגדרות", "הגדרות"):
            thr = self._get_threshold_provider() if self._get_threshold_provider else 85
            mode = self._get_mode_provider() if self._get_mode_provider else "normal"
            await self.send_message(
                "<b>⚙️ הגדרות</b>\n\n"
                f"סף התראה נוכחי: <code>{thr}</code>\n"
                f"מצב נוכחי: <code>{self._e(mode)}</code>\n\n"
                "דוגמאות:\n"
                "• <code>/threshold 90</code>\n"
                "• <code>/mode quiet</code>\n"
                "• <code>/mode normal</code>",
                parse_mode="HTML",
            )
            return

        # /lastalert - התראה אחרונה
        if text in ("/lastalert", "lastalert", "התראה אחרונה", "התראה אחרונה"):
            if not self._last_alert_provider:
                if self._alert_history:
                    last = self._alert_history[-1]
                    token = last["token"]
                    symbol = self._e(token.get("symbol", "N/A"))
                    addr = token.get("address", "")
                    score = token.get("final_score", 0)
                    ts = last["timestamp"].strftime("%Y-%m-%d %H:%M:%S UTC")
                    dex = f"https://dexscreener.com/solana/{addr}"
                    await self.send_message(
                        f"<b>📨 התראה אחרונה</b>\n\n"
                        f"<b>Token:</b> <code>{symbol}</code>\n"
                        f"<b>Score:</b> <b>{score}/100</b>\n"
                        f"<b>זמן:</b> <code>{ts}</code>\n\n"
                        f"<code>{addr}</code>\n"
                        f"<a href=\"{dex}\">📊 DexScreener</a>",
                        parse_mode="HTML"
                    )
                else:
                    await self.send_message("ℹ️ אין התראות עדיין.", parse_mode="HTML")
            else:
                last = self._last_alert_provider()
                if last:
                    symbol = self._e(last.get("symbol", "N/A"))
                    addr = last.get("address", "")
                    score = last.get("final_score", 0)
                    dex = f"https://dexscreener.com/solana/{addr}"
                    await self.send_message(
                        f"<b>📨 התראה אחרונה</b>\n\n"
                        f"<b>Token:</b> <code>{symbol}</code>\n"
                        f"<b>Score:</b> <b>{score}/100</b>\n\n"
                        f"<code>{addr}</code>\n"
                        f"<a href=\"{dex}\">📊 DexScreener</a>",
                        parse_mode="HTML"
                    )
                else:
                    await self.send_message("ℹ️ אין התראות עדיין.", parse_mode="HTML")
            return

        # /history [N] - היסטוריית התראות
        if text.startswith("/history") or normalized.startswith("history ") or normalized.startswith("היסטוריה "):
            limit = 10
            parts = text.split()
            if len(parts) > 1:
                try:
                    limit = int(parts[1])
                    if limit < 1 or limit > 50:
                        limit = 10
                except Exception:
                    pass
            
            if self._history_provider:
                history = self._history_provider(limit)
            else:
                history = self._alert_history[-limit:] if len(self._alert_history) > limit else self._alert_history
            
            if not history:
                await self.send_message("ℹ️ אין היסטוריית התראות עדיין.", parse_mode="HTML")
                return
            
            rows = []
            for i, alert in enumerate(reversed(history), 1):
                if isinstance(alert, dict):
                    token = alert.get("token", alert)
                    symbol = self._e(token.get("symbol", "N/A"))
                    score = token.get("final_score", alert.get("score", 0))
                    ts = alert.get("timestamp", datetime.now(timezone.utc))
                    if isinstance(ts, datetime):
                        ts_str = ts.strftime("%m/%d %H:%M")
                    else:
                        ts_str = str(ts)
                    rows.append(f"{i}. <b>{symbol}</b> — <b>{score}/100</b> ({ts_str})")
            
            await self.send_message(
                f"<b>📜 היסטוריית התראות ({len(history)} אחרונות)</b>\n\n" + "\n".join(rows),
                parse_mode="HTML"
            )
            return

        # /search <symbol> - חיפוש לפי סימבול
        if text.startswith("/search") or normalized.startswith("search ") or normalized.startswith("חפש "):
            parts = text.split(maxsplit=1)
            if len(parts) < 2:
                await self.send_message("שימוש: <code>/search &lt;symbol&gt;</code> או <code>חפש &lt;סימבול&gt;</code>", parse_mode="HTML")
                return
            
            symbol = parts[1].strip().upper()
            await self.send_message(f"🔍 מחפש טוקנים עם סימבול <code>{self._e(symbol)}</code>…", parse_mode="HTML")
            
            if self._search_provider:
                try:
                    results = await self._search_provider(symbol)
                    if results:
                        rows = []
                        for token in results[:10]:  # מקסימום 10 תוצאות
                            sym = self._e(token.get("symbol", "N/A"))
                            addr = token.get("address", "")
                            score = token.get("final_score", 0)
                            rows.append(f"• <b>{sym}</b> — <b>{score}/100</b> — <code>{addr[:8]}…</code>")
                        await self.send_message(
                            f"<b>🔍 תוצאות חיפוש: {symbol}</b>\n\n" + "\n".join(rows),
                            parse_mode="HTML",
                            disable_web_page_preview=True
                        )
                    else:
                        await self.send_message(f"אופס, לא מצאתי טוקנים עם סימבול <code>{self._e(symbol)}</code> 😅", parse_mode="HTML")
                except Exception as e:
                    await self.send_message(f"אופס, שגיאה בחיפוש: {self._e(str(e))} 😅", parse_mode="HTML")
            else:
                await self.send_message("אופס, חיפוש לא זמין כרגע 😅", parse_mode="HTML")
            return

        # /watch <address> - מעקב אחרי טוקן
        if text.startswith("/watch") or normalized.startswith("watch ") or normalized.startswith("עקוב "):
            parts = text.split(maxsplit=1)
            if len(parts) < 2:
                await self.send_message("שימוש: <code>/watch &lt;address&gt;</code> או <code>עקוב &lt;כתובת&gt;</code>", parse_mode="HTML")
                return
            
            addr = parts[1].strip()
            # בדיקת תקינות כתובת
            if len(addr) < 32 or len(addr) > 44:
                await self.send_message("אופס, כתובת לא תקינה 😅\nכתובת Solana חייבת להיות 32-44 תווים", parse_mode="HTML")
                return
            
            if self._watch_provider:
                result = self._watch_provider(addr)
                await self.send_message(result, parse_mode="HTML")
            else:
                await self.send_message("אופס, מעקב לא זמין כרגע 😅", parse_mode="HTML")
            return

        # /unwatch <address> - הסרת מעקב
        if text.startswith("/unwatch") or normalized.startswith("unwatch ") or normalized.startswith("הסר עקיבה "):
            parts = text.split(maxsplit=1)
            if len(parts) < 2:
                await self.send_message("שימוש: <code>/unwatch &lt;address&gt;</code>", parse_mode="HTML")
                return
            
            addr = parts[1].strip()
            if self._unwatch_provider:
                result = self._unwatch_provider(addr)
                await self.send_message(result, parse_mode="HTML")
            else:
                await self.send_message("אופס, הסרת מעקב לא זמינה כרגע 😅", parse_mode="HTML")
            return

        # /watched - רשימת טוקנים במעקב
        if text in ("/watched", "watched", "טוקנים במעקב", "מעקב"):
            if self._list_watched_provider:
                watched = self._list_watched_provider()
                if watched:
                    rows = [f"• <code>{addr[:8]}…{addr[-8:]}</code>" for addr in watched[:20]]
                    await self.send_message(
                        f"<b>👁️ טוקנים במעקב ({len(watched)})</b>\n\n" + "\n".join(rows),
                        parse_mode="HTML"
                    )
                else:
                    await self.send_message("ℹ️ אין טוקנים במעקב כרגע.", parse_mode="HTML")
            else:
                await self.send_message("אופס, רשימת מעקב לא זמינה כרגע 😅", parse_mode="HTML")
            return

        # /compare <addr1> <addr2> - השוואה בין טוקנים
        if text.startswith("/compare") or normalized.startswith("compare ") or normalized.startswith("השווה "):
            parts = text.split(maxsplit=2)
            if len(parts) < 3:
                await self.send_message("שימוש: <code>/compare &lt;address1&gt; &lt;address2&gt;</code>", parse_mode="HTML")
                return
            
            addr1, addr2 = parts[1].strip(), parts[2].strip()
            # בדיקת תקינות כתובות
            if len(addr1) < 32 or len(addr1) > 44 or len(addr2) < 32 or len(addr2) > 44:
                await self.send_message("אופס, אחת מהכתובות לא תקינה 😅\nכתובת Solana חייבת להיות 32-44 תווים", parse_mode="HTML")
                return
            
            await self.send_message("⚖️ משווה טוקנים… רגע.", parse_mode="HTML")
            
            if self._compare_provider:
                try:
                    result = await self._compare_provider(addr1, addr2)
                    await self.send_message(result, parse_mode="HTML", disable_web_page_preview=True)
                except Exception as e:
                    logger.error(f"Compare failed: {e}", exc_info=True)
                    await self.send_message(f"אופס, שגיאה בהשוואה: {self._e(str(e))} 😅", parse_mode="HTML")
            else:
                await self.send_message("אופס, השוואה לא זמינה כרגע 😅", parse_mode="HTML")
            return

        # /favorites - רשימת מועדפים
        if text in ("/favorites", "favorites", "מועדפים", "⭐ מועדפים"):
            if self._favorites_provider:
                favorites = self._favorites_provider()
                if favorites:
                    rows = []
                    for token in favorites[:20]:
                        sym = self._e(token.get("symbol", "N/A"))
                        addr = token.get("address", "")
                        score = token.get("final_score", 0)
                        rows.append(f"• <b>{sym}</b> — <b>{score}/100</b> — <code>{addr[:8]}…</code>")
                    await self.send_message(
                        f"<b>⭐ מועדפים ({len(favorites)})</b>\n\n" + "\n".join(rows),
                        parse_mode="HTML",
                        disable_web_page_preview=True
                    )
                else:
                    await self.send_message("ℹ️ אין מועדפים כרגע.", parse_mode="HTML")
            else:
                await self.send_message("אופס, מועדפים לא זמינים כרגע 😅", parse_mode="HTML")
            return

        # /fav <address> - הוספה למועדפים
        if text.startswith("/fav") or normalized.startswith("fav ") or normalized.startswith("הוסף למועדפים "):
            parts = text.split(maxsplit=1)
            if len(parts) < 2:
                await self.send_message("שימוש: <code>/fav &lt;address&gt;</code>", parse_mode="HTML")
                return
            
            addr = parts[1].strip()
            if self._add_favorite_provider:
                result = self._add_favorite_provider(addr)
                await self.send_message(result, parse_mode="HTML")
            else:
                await self.send_message("אופס, הוספה למועדפים לא זמינה כרגע 😅", parse_mode="HTML")
            return

        # /unfav <address> - הסרה ממועדפים
        if text.startswith("/unfav") or normalized.startswith("unfav ") or normalized.startswith("הסר ממועדפים "):
            parts = text.split(maxsplit=1)
            if len(parts) < 2:
                await self.send_message("שימוש: <code>/unfav &lt;address&gt;</code>", parse_mode="HTML")
                return
            
            addr = parts[1].strip()
            if self._remove_favorite_provider:
                result = self._remove_favorite_provider(addr)
                await self.send_message(result, parse_mode="HTML")
            else:
                await self.send_message("אופס, הסרה ממועדפים לא זמינה כרגע 😅", parse_mode="HTML")
            return

        # /export - ייצוא נתונים
        if text in ("/export", "export", "ייצוא", "ייצא נתונים"):
            if self._export_provider:
                try:
                    result = self._export_provider()
                    await self.send_message(result, parse_mode="HTML", disable_web_page_preview=True)
                except Exception as e:
                    await self.send_message(f"אופס, שגיאה בייצוא: {self._e(str(e))} 😅", parse_mode="HTML")
            else:
                await self.send_message("אופס, ייצוא לא זמין כרגע 😅", parse_mode="HTML")
            return

        # /filter - הגדרת פילטרים
        if text.startswith("/filter") or normalized.startswith("filter ") or normalized.startswith("פילטר "):
            if not self._filter_provider or not self._get_filters_provider:
                await self.send_message("אופס, פילטרים לא זמינים כרגע 😅", parse_mode="HTML")
                return
            
            parts = text.split(maxsplit=1)
            if len(parts) == 1:
                # הצג פילטרים נוכחיים
                filters = self._get_filters_provider()
                if filters:
                    rows = []
                    for key, value in filters.items():
                        rows.append(f"• <b>{key}:</b> <code>{value}</code>")
                    await self.send_message(
                        "<b>🔍 פילטרים נוכחיים</b>\n\n" + "\n".join(rows) + "\n\n"
                        "שימוש: <code>/filter min_score=90 max_holders=1000</code>",
                        parse_mode="HTML"
                    )
                else:
                    await self.send_message(
                        "ℹ️ אין פילטרים מוגדרים.\n\n"
                        "שימוש: <code>/filter min_score=90 max_holders=1000</code>",
                        parse_mode="HTML"
                    )
                return
            
            # פרסר פילטרים
            filter_str = parts[1].strip()
            try:
                filters_dict = {}
                for item in filter_str.split():
                    if "=" in item:
                        key, value = item.split("=", 1)
                        try:
                            filters_dict[key] = int(value)
                        except ValueError:
                            filters_dict[key] = value
                result = self._filter_provider(filters_dict)
                await self.send_message(result, parse_mode="HTML")
            except Exception as e:
                await self.send_message(f"אופס, שגיאה בהגדרת פילטרים: {self._e(str(e))} 😅", parse_mode="HTML")
            return

        # /trends - טרנדים
        if text in ("/trends", "trends", "טרנדים", "📈 טרנדים"):
            if self._trends_provider:
                try:
                    result = self._trends_provider()
                    await self.send_message(result, parse_mode="HTML", disable_web_page_preview=True)
                except Exception as e:
                    await self.send_message(f"אופס, שגיאה בטרנדים: {self._e(str(e))} 😅", parse_mode="HTML")
            else:
                await self.send_message("אופס, טרנדים לא זמינים כרגע 😅", parse_mode="HTML")
            return

        # פקודות מסחר
        # /buy או "קנה" - קנייה
        if text.startswith("/buy") or normalized.startswith("קנה ") or normalized.startswith("buy "):
            parts = text.split(maxsplit=2)
            if len(parts) >= 3:
                # /buy <amount> <address>
                try:
                    amount_sol = float(parts[1])
                    token_address = parts[2]
                    if self._buy_provider:
                        await self.send_message(
                            f"🔄 קונה {amount_sol} SOL של <code>{self._e(token_address)}</code>...",
                            parse_mode="HTML"
                        )
                        try:
                            result = await self._buy_provider(token_address, amount_sol)
                            await self.send_message(result, parse_mode="HTML")
                        except Exception as e:
                            await self.send_message(
                                f"אופס, הקנייה נכשלה 😅\n{self._e(str(e))}",
                                parse_mode="HTML"
                            )
                    else:
                        await self.send_message("אופס, Buy לא זמין כרגע 😅", parse_mode="HTML")
                except (ValueError, IndexError):
                    await self.send_message(
                        "שימוש: <code>/buy &lt;amount_sol&gt; &lt;token_address&gt;</code>\n"
                        "דוגמה: <code>/buy 0.1 DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263</code>",
                        parse_mode="HTML"
                    )
            else:
                await self.send_message(
                    "שימוש: <code>/buy &lt;amount_sol&gt; &lt;token_address&gt;</code>\n"
                    "דוגמה: <code>/buy 0.1 &lt;address&gt;</code>",
                    parse_mode="HTML"
                )
            return
        
        # /sell או "מכור" - מכירה
        if text.startswith("/sell") or normalized.startswith("מכור ") or normalized.startswith("sell "):
            parts = text.split(maxsplit=1)
            if len(parts) >= 2:
                token_address = parts[1]
                if self._sell_provider:
                    await self.send_message(
                        f"🔄 בוא נמכור! מוכר <code>{self._e(token_address)}</code>...",
                        parse_mode="HTML"
                    )
                    try:
                        result = await self._sell_provider(token_address)
                        await self.send_message(result, parse_mode="HTML")
                    except Exception as e:
                            await self.send_message(
                                f"אופס, המכירה נכשלה 😅\n{self._e(str(e))}",
                                parse_mode="HTML"
                            )
                else:
                    await self.send_message("אופס, Sell לא זמין כרגע 😅", parse_mode="HTML")
            else:
                await self.send_message(
                    "שימוש: <code>/sell &lt;token_address&gt;</code>\n"
                    "דוגמה: <code>/sell DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263</code>",
                    parse_mode="HTML"
                )
            return
        
        # /portfolio או "תיק" - הצגת פוזיציות
        if text in ("/portfolio", "portfolio", "תיק", "💼 תיק", "/positions", "positions"):
            if self._portfolio_provider:
                try:
                    result = await self._portfolio_provider()
                    await self.send_message(result, parse_mode="HTML", disable_web_page_preview=True)
                except Exception as e:
                        await self.send_message(
                            f"אופס, שגיאה בהצגת תיק: {self._e(str(e))} 😅",
                            parse_mode="HTML"
                        )
            else:
                await self.send_message("אופס, Portfolio לא זמין כרגע 😅", parse_mode="HTML")
            return
        
        # /profit או "רווח" - הצגת רווחים/הפסדים
        if text in ("/profit", "profit", "רווח", "💰 רווח", "/stats", "stats", "סטטיסטיקות"):
            if self._profit_provider:
                try:
                    result = await self._profit_provider()
                    await self.send_message(result, parse_mode="HTML")
                except Exception as e:
                    await self.send_message(
                        f"אופס, שגיאה בהצגת רווחים: {self._e(str(e))} 😅",
                        parse_mode="HTML"
                    )
            else:
                await self.send_message("אופס, Profit stats לא זמין כרגע 😅", parse_mode="HTML")
            return
        
        # /withdraw או "הוצא" - העברת כסף לכתובת היעד
        if text.startswith("/withdraw") or normalized.startswith("הוצא ") or normalized.startswith("withdraw "):
            parts = text.split(maxsplit=1)
            amount_sol = None
            if len(parts) >= 2:
                try:
                    amount_sol = float(parts[1])
                except ValueError:
                    await self.send_message(
                        "שימוש: <code>/withdraw [amount]</code>\n"
                        "דוגמה: <code>/withdraw 0.5</code> (אם לא מצוין, מעביר הכל פחות reserve)",
                        parse_mode="HTML"
                    )
                    return
            
            if self._withdraw_provider:
                await self.send_message(
                    "🔄 מעביר כסף...",
                    parse_mode="HTML"
                )
                try:
                    result = await self._withdraw_provider(amount_sol)
                    await self.send_message(result, parse_mode="HTML")
                except Exception as e:
                    await self.send_message(
                        f"אופס, ההעברה נכשלה 😅\n{self._e(str(e))}",
                        parse_mode="HTML"
                    )
            else:
                await self.send_message("אופס, Withdraw לא זמין כרגע 😅", parse_mode="HTML")
            return
        
        # טיפול בסכום מותאם (אחרי buy_custom)
        # אם ההודעה היא מספר, זה יכול להיות סכום לקנייה
        try:
            amount_sol = float(text)
            # בדוק אם יש token_address ב-state (נצטרך להוסיף state management)
            # כרגע נדלג על זה - נשתמש בפקודה /buy מלאה
        except ValueError:
            pass
        
        # Friendly fallback (Hebrew + examples) - שיחה טבעית יותר
        await self.send_message(
            "<b>לא הבנתי</b> 🙂\n\n"
            "נסה אחד מהבאים:\n"
            "• <code>סטטוס</code> / <code>/status</code>\n"
            "• <code>טופ</code> / <code>/top</code>\n"
            "• <code>בדוק &lt;כתובת טוקן&gt;</code>\n"
            "• <code>קנה &lt;amount&gt; &lt;address&gt;</code> / <code>/buy</code>\n"
            "• <code>מכור &lt;address&gt;</code> / <code>/sell</code>\n"
            "• <code>תיק</code> / <code>/portfolio</code>\n"
            "• <code>רווח</code> / <code>/profit</code>\n"
            "• <code>הוצא [amount]</code> / <code>/withdraw</code>\n"
            "• <code>השתק 30ד</code> / <code>/mute 30m</code>\n"
            "• <code>תפריט</code> / <code>/menu</code>\n"
            "• <code>עזרה</code> / <code>/help</code>",
            parse_mode="HTML",
        )


def build_telegram_controller(
    status_provider: StatusProvider,
    check_provider: CheckProvider,
    top_provider: Optional[TopProvider] = None,
    scan_now_provider: Optional[ScanNowProvider] = None,
    set_threshold_provider: Optional[SetThresholdProvider] = None,
    get_threshold_provider: Optional[GetThresholdProvider] = None,
    set_mode_provider: Optional[SetModeProvider] = None,
    get_mode_provider: Optional[GetModeProvider] = None,
    pause_provider: Optional[PauseProvider] = None,
    resume_provider: Optional[ResumeProvider] = None,
    stats_provider: Optional[StatsProvider] = None,
    last_alert_provider: Optional[LastAlertProvider] = None,
    history_provider: Optional[HistoryProvider] = None,
    search_provider: Optional[SearchProvider] = None,
    watch_provider: Optional[WatchProvider] = None,
    unwatch_provider: Optional[UnwatchProvider] = None,
    list_watched_provider: Optional[ListWatchedProvider] = None,
    compare_provider: Optional[CompareProvider] = None,
    favorites_provider: Optional[FavoritesProvider] = None,
    add_favorite_provider: Optional[AddFavoriteProvider] = None,
    remove_favorite_provider: Optional[RemoveFavoriteProvider] = None,
    export_provider: Optional[ExportProvider] = None,
        filter_provider: Optional[FilterProvider] = None,
        get_filters_provider: Optional[GetFiltersProvider] = None,
        trends_provider: Optional[TrendsProvider] = None,
        buy_provider: Optional[BuyProvider] = None,
        sell_provider: Optional[SellProvider] = None,
        portfolio_provider: Optional[PortfolioProvider] = None,
) -> Optional[TelegramBotController]:
    if not settings.telegram_bot_token or not settings.telegram_chat_id:
        return None
    cfg = TelegramBotConfig(token=settings.telegram_bot_token, chat_id=settings.telegram_chat_id)
    return TelegramBotController(
        cfg,
        status_provider=status_provider,
        check_provider=check_provider,
        top_provider=top_provider,
        scan_now_provider=scan_now_provider,
        set_threshold_provider=set_threshold_provider,
        get_threshold_provider=get_threshold_provider,
        set_mode_provider=set_mode_provider,
        get_mode_provider=get_mode_provider,
        pause_provider=pause_provider,
        resume_provider=resume_provider,
        stats_provider=stats_provider,
        last_alert_provider=last_alert_provider,
        history_provider=history_provider,
        search_provider=search_provider,
        watch_provider=watch_provider,
        unwatch_provider=unwatch_provider,
        list_watched_provider=list_watched_provider,
        compare_provider=compare_provider,
        favorites_provider=favorites_provider,
        add_favorite_provider=add_favorite_provider,
        remove_favorite_provider=remove_favorite_provider,
        export_provider=export_provider,
        filter_provider=filter_provider,
        get_filters_provider=get_filters_provider,
        trends_provider=trends_provider,
        buy_provider=buy_provider,
        sell_provider=sell_provider,
        portfolio_provider=portfolio_provider,
    )

