"""
SolanaHunter - Main Entry Point
AI-Powered Solana Token Hunter & Trading Bot
"""

import asyncio
import signal
import sys
from pathlib import Path
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
        self._last_tokens: list[dict] = []
        self._last_scan_ts: float | None = None
        self.telegram = build_telegram_controller(
            status_provider=self._telegram_status,
            check_provider=self._telegram_check_token,
            top_provider=self._telegram_top_tokens,
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
                try:
                    logger.info("🔍 Starting token discovery...")
                    tokens = await self.scanner.discover_new_tokens(hours=24)
                    
                    if tokens:
                        # Analyze each token
                        for token in tokens[:10]:  # Analyze top 10 to avoid rate limits
                            try:
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
                                    logger.warning(
                                        f"🔥 HIGH SCORE ALERT: {token['symbol']} - "
                                        f"{token_score.final_score}/100 ({token_score.grade.value})"
                                    )

                                    # Telegram alert (send once per token)
                                    if self.telegram and token.get("address") and token["address"] not in self._alerts_sent:
                                        self._alerts_sent.add(token["address"])
                                        asyncio.create_task(self.telegram.send_alert(token))
                                
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
    # Telegram helpers
    # ---------------------------
    def _telegram_status(self) -> str:
        last_scan = "never" if not self._last_scan_ts else "recently"
        return (
            "SolanaHunter is running.\n"
            f"Scan interval: {settings.scan_interval_seconds}s\n"
            f"Alert threshold: {settings.alert_threshold}\n"
            f"Smart wallets tracked: {get_smart_money_tracker().get_smart_wallet_count()}\n"
            f"Last scan: {last_scan}\n"
            f"Last tokens cached: {len(self._last_tokens)}\n"
        )

    def _telegram_top_tokens(self, limit: int = 10) -> str:
        if not self._last_tokens:
            return "<b>No recent tokens yet.</b>"

        # Sort by final_score if present
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
        On-demand analysis for /check <token_address>.
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
        return (
            "<b>📊 Token Check</b>\n\n"
            f"<b>Score:</b> <b>{token_score.final_score}/100</b> ({token_score.grade.value})\n"
            f"<b>Category:</b> {token_score.category.value}\n\n"
            f"Safety: {safety.safety_score}/100\n"
            f"Holders: {holders.holder_count} ({holders.holder_score}/20)\n"
            f"Top10%: {holders.top_10_percentage:.1f}%\n"
            f"Smart Money: {smart_money_count} ({token_score.smart_money_score}/15)\n\n"
            f"<code>{token_address}</code>\n"
            f"<a href=\"{dex}\">DexScreener</a>"
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
