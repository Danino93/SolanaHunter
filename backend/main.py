"""
SolanaHunter - Main Entry Point
AI-Powered Solana Token Hunter & Trading Bot

📋 מה הקובץ הזה עושה:
-------------------
זה הקובץ הראשי של הבוט - נקודת הכניסה הראשית.

הקובץ הזה:
1. מפעיל את כל המערכת - סריקה, ניתוח, התראות
2. מנהל את הלולאה הראשית (סריקה כל X שניות)
3. מטפל בכל הטוקנים שנמצאו - בודק, מנתח, נותן ציון
4. שולח התראות לטלגרם על טוקנים טובים (ציון 85+)
5. מספק נתונים לטלגרם בוט (פקודות כמו /status, /check, וכו')

🔧 פקודות טלגרם שמוגדרות כאן:
- /status - מצב הבוט והסריקה
- /check <address> - בדיקת טוקן ספציפי
- /top [N] - טופ N טוקנים
- /scan - סריקה מיידית
- /stats - סטטיסטיקות מפורטות
- /lastalert - התראה אחרונה
- /history [N] - היסטוריית התראות
- /search <symbol> - חיפוש לפי סימבול
- /watch <address> - מעקב אחרי טוקן
- /compare <addr1> <addr2> - השוואה בין טוקנים
- /favorites - מועדפים
- /export - ייצוא נתונים
- ועוד...

📝 איך זה עובד:
1. יוצר את כל המודולים (Scanner, Analyzer, Telegram)
2. מריץ לולאה אינסופית שסורקת טוקנים חדשים
3. כל טוקן עובר: סריקה → בדיקת חוזה → ניתוח מחזיקים → ציון
4. אם הציון >= סף התראה → שולח התראה לטלגרם

💡 טיפ: אם אתה רוצה לשנות את תדירות הסריקה, ערוך את SCAN_INTERVAL_SECONDS ב-.env
"""

import asyncio
import signal
import sys
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional
from rich.console import Console
from rich.panel import Panel

from core.config import settings
from utils.logger import get_logger, setup_logger
from scanner.token_scanner import TokenScanner
from analyzer.contract_checker import ContractChecker
from analyzer.holder_analyzer import HolderAnalyzer
from analyzer.scoring_engine import ScoringEngine
from analyzer.smart_money_tracker import get_smart_money_tracker
from analyzer.smart_money_discovery import get_discovery_engine
from communication.telegram_bot import build_telegram_controller
from database.supabase_client import get_supabase_client

# Setup logging
logger = setup_logger("solanahunter", settings.log_level)
console = Console()


class SolanaHunter:
    """Main application class"""
    
    def __init__(self):
        self.scanner = TokenScanner()
        self.contract_checker = None  # Will be initialized in async context
        self.holder_analyzer = HolderAnalyzer()
        self.scoring_engine = ScoringEngine(alert_threshold=settings.alert_threshold)
        self.discovery_engine = get_discovery_engine()
        self.supabase = get_supabase_client()  # Supabase client for database
        self._last_tokens: list[dict] = []
        self._last_scan_ts: float | None = None
        self._mode: str = "normal"  # "normal" or "quiet"
        self._paused: bool = False
        self._scan_count: int = 0
        self._tokens_analyzed: int = 0
        self._high_score_count: int = 0
        self._watched_tokens: set[str] = set()  # טוקנים במעקב
        self._favorites: dict[str, dict] = {}  # מועדפים: address -> token dict
        self._alert_history: list[dict] = []  # היסטוריית התראות
        self._filters: dict = {}  # פילטרים מותאמים
        self.telegram = build_telegram_controller(
            status_provider=self._telegram_status,
            check_provider=self._telegram_check_token,
            top_provider=self._telegram_top_tokens,
            scan_now_provider=self._telegram_scan_now,
            set_threshold_provider=self._telegram_set_threshold,
            get_threshold_provider=self._telegram_get_threshold,
            set_mode_provider=self._telegram_set_mode,
            get_mode_provider=self._telegram_get_mode,
            pause_provider=self._telegram_pause,
            resume_provider=self._telegram_resume,
            stats_provider=self._telegram_stats,
            last_alert_provider=self._telegram_last_alert,
            history_provider=self._telegram_history,
            search_provider=self._telegram_search,
            watch_provider=self._telegram_watch,
            unwatch_provider=self._telegram_unwatch,
            list_watched_provider=self._telegram_list_watched,
            compare_provider=self._telegram_compare,
            favorites_provider=self._telegram_favorites,
            add_favorite_provider=self._telegram_add_favorite,
            remove_favorite_provider=self._telegram_remove_favorite,
            export_provider=self._telegram_export,
            filter_provider=self._telegram_set_filter,
            get_filters_provider=self._telegram_get_filters,
            trends_provider=self._telegram_trends,
        )
        self.running = False
        self.initial_discovery_done = False
        self._alerts_sent: set[str] = set()
    
    async def start(self):
        """Start the bot"""
        self.running = True
        
        # Display startup banner
        comm_status = (
            "[green]✓[/green] Telegram: Ready\n" if self.telegram else "[yellow]⚠[/yellow] Telegram: Not configured\n"
        )
        banner = Panel.fit(
            "[bold cyan]🚀 SolanaHunter[/bold cyan]\n"
            "[dim]AI-Powered Solana Token Hunter & Trading Bot[/dim]\n\n"
            f"[green]✓[/green] Scanner: Ready\n"
            f"[green]✓[/green] Config: Loaded\n"
            f"[green]✓[/green] Analyzer: Ready (Day 2-4, 6)\n"
            f"[green]✓[/green] Scoring: Ready\n"
            f"[green]✓[/green] Smart Money: Auto-Discovery Enabled\n"
            f"{comm_status}"
            f"[yellow]⚠[/yellow] Executor: Day 15\n"
            f"[green]✓[/green] Communication: Day 8-11 (Telegram)\n",
            title="[bold]System Status[/bold]",
            border_style="cyan"
        )
        console.print(banner)
        
        logger.info("🚀 SolanaHunter started successfully")

        # Start Telegram polling (non-blocking)
        if self.telegram:
            asyncio.create_task(self.telegram.start())
        
        # Run initial smart wallet discovery (once, in background)
        if not self.initial_discovery_done:
            logger.info("🔍 Running initial smart wallet discovery...")
            asyncio.create_task(self._run_initial_discovery())
        
        # Start scanning loop
        try:
            await self._scan_loop()
        except KeyboardInterrupt:
            logger.info("🛑 Shutdown requested by user")
        finally:
            await self.shutdown()
    
    async def _run_initial_discovery(self):
        """Run initial smart wallet discovery in background"""
        try:
            discovered = await self.discovery_engine.run_initial_discovery()
            self.initial_discovery_done = True
            logger.info(f"✅ Smart wallet discovery complete: {len(discovered)} wallets found")
        except Exception as e:
            logger.error(f"❌ Discovery failed: {e}", exc_info=True)
    
    async def _scan_loop(self):
        """Main scanning loop"""
        # Initialize contract checker
        self.contract_checker = ContractChecker()
        await self.contract_checker.__aenter__()
        
        try:
            while self.running:
                # Check if paused
                if self._paused:
                    await asyncio.sleep(10)
                    continue
                try:
                    logger.info("🔍 Starting token discovery...")
                    self._scan_count += 1
                    tokens = await self.scanner.discover_new_tokens(hours=24)
                    
                    if tokens:
                        # Analyze each token
                        analyze_limit = 10 if self._mode == "normal" else 5  # Quiet mode: analyze less
                        for token in tokens[:analyze_limit]:  # Analyze top N to avoid rate limits
                            try:
                                self._tokens_analyzed += 1
                                # Contract safety check
                                safety = await self.contract_checker.check_contract(token["address"])
                                token["safety_score"] = safety.safety_score
                                token["ownership_renounced"] = safety.ownership_renounced
                                token["liquidity_locked"] = safety.liquidity_locked
                                token["mint_authority_disabled"] = safety.mint_authority_disabled
                                
                                # Holder analysis
                                holders = await self.holder_analyzer.analyze(token["address"])
                                token["holder_count"] = holders.holder_count
                                token["top_10_percentage"] = holders.top_10_percentage
                                token["is_concentrated"] = holders.is_concentrated
                                token["holder_score"] = holders.holder_score
                                
                                # Smart money check
                                smart_money_tracker = get_smart_money_tracker()
                                holder_addresses = [h.get("address", "") for h in holders.top_holders]
                                smart_money_count = smart_money_tracker.check_if_holds(
                                    token["address"],
                                    holder_addresses
                                )
                                token["smart_money_count"] = smart_money_count
                                
                                # Calculate final score
                                token_score = self.scoring_engine.calculate_score(
                                    safety=safety,
                                    holders=holders,
                                    smart_money_count=smart_money_count
                                )
                                
                                token["final_score"] = token_score.final_score
                                token["grade"] = token_score.grade.value
                                token["category"] = token_score.category.value
                                
                                # Check if should alert
                                if self.scoring_engine.should_alert(token_score):
                                    self._high_score_count += 1
                                    logger.warning(
                                        f"🔥 HIGH SCORE ALERT: {token['symbol']} - "
                                        f"{token_score.final_score}/100 ({token_score.grade.value})"
                                    )

                                    # Telegram alert (send once per token, only if not quiet mode)
                                    if (
                                        self.telegram 
                                        and token.get("address") 
                                        and token["address"] not in self._alerts_sent
                                        and self._mode != "quiet"
                                    ):
                                        self._alerts_sent.add(token["address"])
                                        # שמור בהיסטוריה
                                        self._alert_history.append({
                                            "timestamp": datetime.now(timezone.utc),
                                            "token": token.copy(),
                                        })
                                        # שמור רק 100 האחרונות
                                        if len(self._alert_history) > 100:
                                            self._alert_history.pop(0)
                                        asyncio.create_task(self.telegram.send_alert(token))
                                    
                                    # בדוק אם טוקן במעקב
                                    if token.get("address") in self._watched_tokens:
                                        # אפשר לשלוח התראה מיוחדת על טוקנים במעקב
                                        pass
                                
                                # Auto-discovery: If token performs well, discover smart wallets
                                # This runs in background to not slow down scanning
                                if token.get("price_usd", 0) > 0:
                                    # Check performance (simplified - would need entry price tracking)
                                    # For now, we'll discover from historical analysis
                                    pass
                                
                                logger.info(
                                    f"📊 {token['symbol']}: "
                                    f"Final={token_score.final_score}/100 ({token_score.grade.value}) | "
                                    f"Safety={safety.safety_score}/100 | "
                                    f"Holders={holders.holder_count} ({holders.holder_score}/20) | "
                                    f"SmartMoney={smart_money_count} ({token_score.smart_money_score}/15) | "
                                    f"Top10%={holders.top_10_percentage:.1f}%"
                                )
                            except Exception as e:
                                logger.warning(f"⚠️ Failed to analyze {token.get('symbol', 'unknown')}: {e}")
                        
                        self.scanner.display_tokens(tokens)
                        logger.info(f"✅ Discovered {len(tokens)} new tokens")
                        self._last_tokens = tokens[:]
                        self._last_scan_ts = asyncio.get_event_loop().time()
                    else:
                        logger.info("⏳ No new tokens found")
                        self._last_tokens = []
                        self._last_scan_ts = asyncio.get_event_loop().time()
                    
                    # Wait for next scan
                    await asyncio.sleep(settings.scan_interval_seconds)
                    
                except Exception as e:
                    logger.error(f"❌ Error in scan loop: {e}", exc_info=True)
                    await asyncio.sleep(60)  # Wait before retry
        finally:
            # Cleanup contract checker
            if self.contract_checker:
                await self.contract_checker.__aexit__(None, None, None)
    
    async def shutdown(self):
        """Cleanup and shutdown"""
        logger.info("🔄 Shutting down...")
        await self.scanner.close()
        await self.holder_analyzer.close()
        await self.discovery_engine.close()
        if self.telegram:
            await self.telegram.stop()
        logger.info("✅ Shutdown complete")

    # ---------------------------
    # Telegram helpers - כל הפונקציות שמספקות נתונים לטלגרם בוט
    # ---------------------------
    
    async def _telegram_status(self) -> str:
        """
        📊 פקודת /status - מצב הבוט
        מחזיר מידע על מצב הבוט: תדירות סריקה, סף התראה, balance, וכו'
        """
        last_scan = "never" if not self._last_scan_ts else "recently"
        
        # נסה לקבל balance (אם wallet מוגדר)
        wallet_info = ""
        try:
            from executor.wallet_manager import get_wallet_manager
            wallet = get_wallet_manager()
            if wallet:
                balance = await wallet.get_balance()
                address = wallet.get_address()
                wallet_info = f"\n💰 Wallet: {address[:8]}...{address[-6:]}\nBalance: {balance:.4f} SOL"
        except Exception:
            pass  # Wallet לא מוגדר או יש שגיאה
        
        return (
            "<b>🤖 SolanaHunter Status</b>\n\n"
            f"<b>Scan interval:</b> {settings.scan_interval_seconds}s\n"
            f"<b>Alert threshold:</b> {settings.alert_threshold}\n"
            f"<b>Smart wallets tracked:</b> {get_smart_money_tracker().get_smart_wallet_count()}\n"
            f"<b>Last scan:</b> {last_scan}\n"
            f"<b>Last tokens cached:</b> {len(self._last_tokens)}\n"
            f"{wallet_info}"
        )

    def _telegram_top_tokens(self, limit: int = 10) -> str:
        """
        🏆 פקודת /top [N] - טופ N טוקנים
        מחזיר את הטוקנים הכי טובים מהסריקה האחרונה (ממוינים לפי ציון)
        """
        if not self._last_tokens:
            return "<b>No recent tokens yet.</b>"

        # מיון לפי ציון (הכי גבוה ראשון)
        tokens = sorted(self._last_tokens, key=lambda t: int(t.get("final_score", t.get("safety_score", 0)) or 0), reverse=True)
        rows = []
        for t in tokens[:limit]:
            sym = (t.get("symbol") or "N/A").replace("<", "").replace(">", "")
            addr = t.get("address", "")
            score = int(t.get("final_score", t.get("safety_score", 0)) or 0)
            grade = t.get("grade", "")
            rows.append(f"• <b>{sym}</b> — <b>{score}</b>/100 {grade} — <code>{addr[:8]}…</code>")

        return "<b>🏆 Top Tokens (last scan)</b>\n\n" + "\n".join(rows)

    async def _telegram_check_token(self, token_address: str) -> str:
        """
        🔍 פקודת /check <address> - בדיקת טוקן ספציפי
        מנתח טוקן על פי דרישה ומחזיר ניתוח מפורט:
        - ציון מלא (0-100)
        - בדיקת בטיחות (ownership, liquidity, mint)
        - ניתוח מחזיקים
        - Smart Money count
        - קישורים ל-DexScreener ו-Solscan
        """
        if not self.contract_checker:
            # If scan loop didn't start yet, create a temporary checker
            checker = ContractChecker()
            await checker.__aenter__()
            try:
                safety = await checker.check_contract(token_address)
            finally:
                await checker.__aexit__(None, None, None)
        else:
            safety = await self.contract_checker.check_contract(token_address)

        holders = await self.holder_analyzer.analyze(token_address)
        holder_addresses = [h.get("address", "") for h in holders.top_holders]
        smart_money_count = get_smart_money_tracker().check_if_holds(token_address, holder_addresses)

        token_score = self.scoring_engine.calculate_score(
            safety=safety,
            holders=holders,
            smart_money_count=smart_money_count,
        )

        dex = f"https://dexscreener.com/solana/{token_address}"
        solscan = f"https://solscan.io/token/{token_address}"
        
        # Risk assessment
        risk_level = "🟢 נמוך" if token_score.final_score >= 85 else "🟡 בינוני" if token_score.final_score >= 70 else "🔴 גבוה"
        
        return (
            "<b>📊 בדיקת טוקן</b>\n\n"
            f"<b>ציון:</b> <b>{token_score.final_score}/100</b> ({token_score.grade.value})\n"
            f"<b>קטגוריה:</b> {token_score.category.value}\n"
            f"<b>רמת סיכון:</b> {risk_level}\n\n"
            f"<b>פירוט:</b>\n"
            f"• בטיחות: {safety.safety_score}/100\n"
            f"  {'✅' if safety.ownership_renounced else '❌'} Ownership renounced\n"
            f"  {'✅' if safety.liquidity_locked else '❌'} Liquidity locked\n"
            f"  {'✅' if safety.mint_authority_disabled else '❌'} Mint disabled\n"
            f"• מחזיקים: {holders.holder_count} (ציון: {holders.holder_score}/20)\n"
            f"• Top 10%: {holders.top_10_percentage:.1f}%\n"
            f"• Smart Money: {smart_money_count} (ציון: {token_score.smart_money_score}/15)\n\n"
            f"<code>{token_address}</code>\n\n"
            f"<a href=\"{dex}\">📊 DexScreener</a> | <a href=\"{solscan}\">🔍 Solscan</a>"
        )

    async def _telegram_scan_now(self) -> str:
        """
        ▶️ פקודת /scan - סריקה מיידית
        מריץ סריקה מיידית של טוקנים חדשים (בלי לחכות לסריקה הבאה)
        """
        if self._paused:
            return "❌ הבוט מושהה. השתמש ב-<code>/resume</code> כדי להמשיך."
        
        try:
            logger.info("🔍 Manual scan triggered via Telegram")
            tokens = await self.scanner.discover_new_tokens(hours=24)
            if tokens:
                return f"✅ סריקה הושלמה: נמצאו <b>{len(tokens)}</b> טוקנים חדשים.\n\nהשתמש ב-<code>/top</code> כדי לראות את הטובים ביותר."
            else:
                return "⏳ לא נמצאו טוקנים חדשים כרגע."
        except Exception as e:
            logger.error(f"Manual scan failed: {e}", exc_info=True)
            return f"❌ שגיאה בסריקה: {str(e)}"

    def _telegram_set_threshold(self, value: int) -> str:
        """
        ⚙️ פקודת /threshold [N] - שינוי סף התראה
        משנה את הסף להתראות (0-100). טוקנים עם ציון >= סף יקבלו התראה.
        """
        if value < 0 or value > 100:
            return "❌ סף חייב להיות בין 0 ל-100."
        old_threshold = self.scoring_engine.alert_threshold
        self.scoring_engine.alert_threshold = value
        logger.info(f"Alert threshold changed: {old_threshold} → {value}")
        return f"✅ סף התראה עודכן: <b>{old_threshold}</b> → <b>{value}</b>"

    def _telegram_get_threshold(self) -> int:
        """מחזיר את סף ההתראה הנוכחי"""
        return self.scoring_engine.alert_threshold

    def _telegram_set_mode(self, mode: str) -> str:
        """
        ⚙️ פקודת /mode [quiet/normal] - שינוי מצב עבודה
        - quiet: מפחית התראות ומנתח פחות טוקנים (חוסך API calls)
        - normal: פעילות רגילה
        """
        mode = mode.lower().strip()
        if mode not in ("quiet", "normal"):
            return f"❌ מצב לא תקין. אפשרויות: <code>quiet</code>, <code>normal</code>"
        old_mode = self._mode
        self._mode = mode
        logger.info(f"Bot mode changed: {old_mode} → {mode}")
        mode_he = "שקט" if mode == "quiet" else "רגיל"
        return f"✅ מצב עודכן: <b>{old_mode}</b> → <b>{mode}</b> ({mode_he})"

    def _telegram_get_mode(self) -> str:
        """Get current bot mode"""
        return self._mode

    def _telegram_pause(self) -> str:
        """
        ⏸️ פקודת /stop - השהת הבוט
        עוצר את הסריקה (אבל הבוט עדיין רץ ומאזין לפקודות)
        """
        if self._paused:
            return "ℹ️ הבוט כבר מושהה."
        self._paused = True
        logger.info("Bot paused via Telegram")
        return "⏸️ הבוט הושהה. השתמש ב-<code>/resume</code> כדי להמשיך."

    def _telegram_resume(self) -> str:
        """
        ▶️ פקודת /resume - חידוש הבוט
        מחדש את הסריקה אחרי שהושהתה
        """
        if not self._paused:
            return "ℹ️ הבוט כבר רץ."
        self._paused = False
        logger.info("Bot resumed via Telegram")
        return "▶️ הבוט חודש. הסריקה תמשיך כרגיל."

    def _telegram_stats(self) -> str:
        """Get bot statistics"""
        last_scan = "לעולם לא" if not self._last_scan_ts else "לאחרונה"
        smart_wallets = get_smart_money_tracker().get_smart_wallet_count()
        
        return (
            "<b>📈 סטטיסטיקות</b>\n\n"
            f"<b>סריקות:</b>\n"
            f"• סריקות שבוצעו: <b>{self._scan_count}</b>\n"
            f"• טוקנים שנבדקו: <b>{self._tokens_analyzed}</b>\n"
            f"• טוקנים עם ציון גבוה: <b>{self._high_score_count}</b>\n"
            f"• התראות שנשלחו: <b>{len(self._alerts_sent)}</b>\n\n"
            f"<b>הגדרות:</b>\n"
            f"• סף התראה: <code>{self.scoring_engine.alert_threshold}</code>\n"
            f"• מצב: <code>{self._mode}</code>\n"
            f"• מושהה: {'כן' if self._paused else 'לא'}\n"
            f"• Smart Wallets: <b>{smart_wallets}</b>\n\n"
            f"<b>ניהול:</b>\n"
            f"• טוקנים במעקב: <b>{len(self._watched_tokens)}</b>\n"
            f"• מועדפים: <b>{len(self._favorites)}</b>\n"
            f"• היסטוריית התראות: <b>{len(self._alert_history)}</b>\n\n"
            f"<b>סריקה אחרונה:</b> {last_scan}\n"
            f"<b>טוקנים אחרונים:</b> {len(self._last_tokens)}"
        )

    def _telegram_last_alert(self) -> Optional[dict]:
        """Get last alert"""
        if self._alert_history:
            return self._alert_history[-1].get("token")
        return None

    def _telegram_history(self, limit: int) -> list[dict]:
        """Get alert history"""
        return self._alert_history[-limit:] if len(self._alert_history) > limit else self._alert_history

    async def _telegram_search(self, symbol: str) -> list[dict]:
        """Search tokens by symbol"""
        symbol_upper = symbol.upper()
        results = []
        # חיפוש בטוקנים האחרונים
        for token in self._last_tokens:
            if token.get("symbol", "").upper() == symbol_upper:
                results.append(token)
        # חיפוש בהיסטוריה
        for alert in self._alert_history:
            token = alert.get("token", {})
            if token.get("symbol", "").upper() == symbol_upper:
                if token not in results:
                    results.append(token)
        return results

    def _telegram_watch(self, address: str) -> str:
        """Add token to watch list"""
        if address in self._watched_tokens:
            return f"ℹ️ הטוקן <code>{address[:8]}…</code> כבר במעקב."
        self._watched_tokens.add(address)
        logger.info(f"Token added to watch list: {address}")
        return f"✅ הטוקן נוסף למעקב: <code>{address[:8]}…{address[-8:]}</code>"

    def _telegram_unwatch(self, address: str) -> str:
        """Remove token from watch list"""
        if address not in self._watched_tokens:
            return f"ℹ️ הטוקן <code>{address[:8]}…</code> לא במעקב."
        self._watched_tokens.remove(address)
        logger.info(f"Token removed from watch list: {address}")
        return f"✅ הטוקן הוסר מהמעקב: <code>{address[:8]}…{address[-8:]}</code>"

    def _telegram_list_watched(self) -> list[str]:
        """List watched tokens"""
        return list(self._watched_tokens)

    async def _telegram_compare(self, addr1: str, addr2: str) -> str:
        """Compare two tokens"""
        # בדוק את שני הטוקנים
        if not self.contract_checker:
            checker = ContractChecker()
            await checker.__aenter__()
            try:
                safety1 = await checker.check_contract(addr1)
                safety2 = await checker.check_contract(addr2)
            finally:
                await checker.__aexit__(None, None, None)
        else:
            safety1 = await self.contract_checker.check_contract(addr1)
            safety2 = await self.contract_checker.check_contract(addr2)

        holders1 = await self.holder_analyzer.analyze(addr1)
        holders2 = await self.holder_analyzer.analyze(addr2)

        holder_addresses1 = [h.get("address", "") for h in holders1.top_holders]
        holder_addresses2 = [h.get("address", "") for h in holders2.top_holders]
        
        smart_money1 = get_smart_money_tracker().check_if_holds(addr1, holder_addresses1)
        smart_money2 = get_smart_money_tracker().check_if_holds(addr2, holder_addresses2)

        score1 = self.scoring_engine.calculate_score(safety1, holders1, smart_money1)
        score2 = self.scoring_engine.calculate_score(safety2, holders2, smart_money2)

        dex1 = f"https://dexscreener.com/solana/{addr1}"
        dex2 = f"https://dexscreener.com/solana/{addr2}"

        winner = "1️⃣" if score1.final_score > score2.final_score else "2️⃣" if score2.final_score > score1.final_score else "⚖️"
        
        return (
            "<b>⚖️ השוואת טוקנים</b>\n\n"
            f"<b>1️⃣ טוקן ראשון:</b>\n"
            f"• ציון: <b>{score1.final_score}/100</b> ({score1.grade.value})\n"
            f"• בטיחות: {safety1.safety_score}/100\n"
            f"• מחזיקים: {holders1.holder_count}\n"
            f"• Smart Money: {smart_money1}\n"
            f"<code>{addr1[:8]}…</code>\n"
            f"<a href=\"{dex1}\">📊 DexScreener</a>\n\n"
            f"<b>2️⃣ טוקן שני:</b>\n"
            f"• ציון: <b>{score2.final_score}/100</b> ({score2.grade.value})\n"
            f"• בטיחות: {safety2.safety_score}/100\n"
            f"• מחזיקים: {holders2.holder_count}\n"
            f"• Smart Money: {smart_money2}\n"
            f"<code>{addr2[:8]}…</code>\n"
            f"<a href=\"{dex2}\">📊 DexScreener</a>\n\n"
            f"<b>🏆 מנצח:</b> {winner}"
        )

    def _telegram_favorites(self) -> list[dict]:
        """Get favorites list"""
        return list(self._favorites.values())

    def _telegram_add_favorite(self, address: str) -> str:
        """Add token to favorites"""
        # נסה למצוא את הטוקן בטוקנים האחרונים או בהיסטוריה
        token = None
        for t in self._last_tokens:
            if t.get("address") == address:
                token = t
                break
        if not token:
            for alert in self._alert_history:
                t = alert.get("token", {})
                if t.get("address") == address:
                    token = t
                    break
        
        if address in self._favorites:
            return f"ℹ️ הטוקן כבר במועדפים."
        
        if token:
            self._favorites[address] = token.copy()
            logger.info(f"Token added to favorites: {address}")
            return f"✅ הטוקן נוסף למועדפים: <code>{address[:8]}…</code>"
        else:
            # אם לא נמצא, שמור רק את הכתובת
            self._favorites[address] = {"address": address}
            return f"✅ כתובת נוספה למועדפים: <code>{address[:8]}…</code>"

    def _telegram_remove_favorite(self, address: str) -> str:
        """Remove token from favorites"""
        if address not in self._favorites:
            return f"ℹ️ הטוקן לא במועדפים."
        del self._favorites[address]
        logger.info(f"Token removed from favorites: {address}")
        return f"✅ הטוקן הוסר ממועדפים: <code>{address[:8]}…</code>"

    def _telegram_export(self) -> str:
        """Export data"""
        import json
        from datetime import datetime
        
        export_data = {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "stats": {
                "scans": self._scan_count,
                "tokens_analyzed": self._tokens_analyzed,
                "high_score_count": self._high_score_count,
                "alerts_sent": len(self._alerts_sent),
            },
            "last_tokens": self._last_tokens[:50],  # מקסימום 50
            "alert_history": [
                {
                    "timestamp": alert["timestamp"].isoformat() if isinstance(alert["timestamp"], datetime) else str(alert["timestamp"]),
                    "token": alert["token"],
                }
                for alert in self._alert_history[-50:]  # מקסימום 50
            ],
            "watched": list(self._watched_tokens),
            "favorites": list(self._favorites.keys()),
        }
        
        json_str = json.dumps(export_data, indent=2, ensure_ascii=False)
        return (
            "<b>📤 ייצוא נתונים</b>\n\n"
            f"<pre>{json_str[:3000]}</pre>\n\n"
            f"<i>💡 העתק את הנתונים לשימוש חיצוני</i>"
        )

    def _telegram_set_filter(self, filters: dict) -> str:
        """Set custom filters"""
        self._filters.update(filters)
        logger.info(f"Filters updated: {filters}")
        return f"✅ פילטרים עודכנו: <code>{filters}</code>"

    def _telegram_get_filters(self) -> dict:
        """Get current filters"""
        return self._filters.copy()

    def _telegram_trends(self) -> str:
        """Get trends"""
        if not self._last_tokens:
            return "ℹ️ אין מספיק נתונים לטרנדים כרגע."
        
        # מיון לפי ציון
        sorted_tokens = sorted(self._last_tokens, key=lambda t: int(t.get("final_score", 0) or 0), reverse=True)
        
        top_5 = sorted_tokens[:5]
        rows = []
        for i, token in enumerate(top_5, 1):
            sym = token.get("symbol", "N/A")
            score = token.get("final_score", 0)
            rows.append(f"{i}. <b>{sym}</b> — <b>{score}/100</b>")
        
        return (
            "<b>📈 טרנדים (טופ 5)</b>\n\n" + "\n".join(rows) + "\n\n"
            "<i>💡 הטוקנים עם הציונים הגבוהים ביותר מהסריקה האחרונה</i>"
        )


def setup_signal_handlers(bot: SolanaHunter):
    """Setup signal handlers for graceful shutdown"""
    def signal_handler(sig, frame):
        logger.info("🛑 Received shutdown signal")
        bot.running = False
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)


async def main():
    """Main entry point"""
    try:
        bot = SolanaHunter()
        setup_signal_handlers(bot)
        
        # Initialize FastAPI server with bot instance
        from api.main import init_app
        api_app = init_app(bot)
        
        # Start FastAPI server in background
        import uvicorn
        from threading import Thread
        
        def run_api():
            uvicorn.run(api_app, host="0.0.0.0", port=8000, log_level="info")
        
        api_thread = Thread(target=run_api, daemon=True)
        api_thread.start()
        logger.info("🚀 FastAPI server started on http://0.0.0.0:8000")
        
        # Start bot
        await bot.start()
    except Exception as e:
        logger.critical(f"💥 Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        console.print("\n[yellow]👋 Goodbye![/yellow]")
        sys.exit(0)
