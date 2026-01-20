"""
Setup Verification Script
Checks that all dependencies and configuration are correct
"""

import sys
from pathlib import Path
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()


def check_python_version():
    """Check Python version"""
    version = sys.version_info
    if version.major >= 3 and version.minor >= 11:
        return True, f"{version.major}.{version.minor}.{version.micro}"
    return False, f"{version.major}.{version.minor}.{version.micro} (Need 3.11+)"


def check_dependencies():
    """Check if required packages are installed"""
    required = [
        "pydantic",
        "httpx",
        "rich",
        "structlog",
    ]
    
    missing = []
    for package in required:
        try:
            __import__(package)
        except ImportError:
            missing.append(package)
    
    return len(missing) == 0, missing


def check_env_file():
    """Check if .env file exists"""
    env_file = Path(".env")
    if env_file.exists():
        return True, ".env file found"
    return False, ".env file not found (copy from env.example)"


def check_logs_dir():
    """Check if logs directory exists"""
    logs_dir = Path("logs")
    if logs_dir.exists():
        return True, "logs/ directory exists"
    return False, "logs/ directory not found (will be created automatically)"


def main():
    """Run all checks"""
    try:
        console.print(Panel.fit(
            "[bold cyan]SolanaHunter Setup Verification[/bold cyan]",
            border_style="cyan"
        ))
    except:
        print("=" * 50)
        print("SolanaHunter Setup Verification")
        print("=" * 50)
    
    table = Table(show_header=True, header_style="bold")
    table.add_column("Check", style="cyan")
    table.add_column("Status", justify="center")
    table.add_column("Details")
    
    # Python version
    ok, details = check_python_version()
    status = "[OK]" if ok else "[FAIL]"
    table.add_row("Python Version", status, details)
    
    # Dependencies
    ok, missing = check_dependencies()
    status = "[OK]" if ok else "[FAIL]"
    details = "All required packages installed" if ok else f"Missing: {', '.join(missing)}"
    table.add_row("Dependencies", status, details)
    
    # .env file
    ok, details = check_env_file()
    status = "[OK]" if ok else "[WARN]"
    table.add_row("Configuration", status, details)

    # Telegram configuration (optional)
    try:
        from core.config import settings as app_settings

        if app_settings.telegram_bot_token and app_settings.telegram_chat_id:
            table.add_row("Telegram", "[OK]", "TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID set")
        else:
            table.add_row("Telegram", "[INFO]", "Not set (Week 2)")
    except Exception as e:
        table.add_row("Telegram", "[WARN]", f"Could not load settings: {e}")
    
    # Logs directory
    ok, details = check_logs_dir()
    status = "[OK]" if ok else "[INFO]"
    table.add_row("Logs Directory", status, details)
    
    try:
        console.print(table)
    except:
        print("\nCheck Results:")
        print(f"Python Version: {status} - {details}")
    
    # Summary
    print("\n")
    if all([
        check_python_version()[0],
        check_dependencies()[0],
    ]):
        try:
            console.print(Panel.fit(
                "[bold green]Setup looks good![/bold green]\n\n"
                "Next steps:\n"
                "1. Copy env.example to .env\n"
                "2. Fill in your API keys\n"
                "3. Run: python main.py",
                title="Ready to Go!",
                border_style="green"
            ))
        except:
            print("=" * 50)
            print("Setup looks good!")
            print("Next steps:")
            print("1. Copy env.example to .env")
            print("2. Fill in your API keys")
            print("3. Run: python main.py")
            print("=" * 50)
    else:
        try:
            console.print(Panel.fit(
                "[bold yellow]Some issues found[/bold yellow]\n\n"
                "Please fix the issues above before running the bot.",
                title="Action Required",
                border_style="yellow"
            ))
        except:
            print("=" * 50)
            print("Some issues found")
            print("Please fix the issues above before running the bot.")
            print("=" * 50)


if __name__ == "__main__":
    main()
