"""
HH Goa Task 3 — CLI entry point.

Usage:
    python main.py search <image_path>
    python main.py verify <record_id>
    python main.py chain               # validate full chain integrity
    python main.py serve               # start FastAPI server
"""
from __future__ import annotations

import asyncio
import logging
import sys
from pathlib import Path

from rich.console import Console
from rich.panel import Panel


console = Console()

# ---------------------------------------------------------------------------
# Logging (suppress verbose lib output during CLI)
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.WARNING,
    format="%(levelname)s  %(name)s  %(message)s",
)
logging.getLogger("src").setLevel(logging.INFO)


def print_banner():
    console.print(Panel.fit(
        "[bold cyan]IMGLEDGER AI PIPELINE[/bold cyan]\n"
        "[dim]Face Identification & Blockchain Verification[/dim]",
        border_style="cyan",
    ))


def print_divider():
    console.print("[dim]" + "=" * 50 + "[/dim]")


# ---------------------------------------------------------------------------
# search command
# ---------------------------------------------------------------------------

async def cmd_search(image_path: str):
    from src.pipeline import run_pipeline, MAX_CANDIDATES
    from src.blockchain import compute_payload_hash

    print_banner()
    console.print()

    if not Path(image_path).exists():
        console.print(f"[red]✗ Image not found: {image_path}[/red]")
        sys.exit(1)

    # Step 1 — Face
    console.print("[bold][[1/6]] Loading face image...[/bold]")
    console.print(f"      [dim]{image_path}[/dim]")

    result = await run_pipeline(image_path)

    if not result.face_detected:
        console.print(f"[red]      ✗ {result.error}[/red]")
        sys.exit(1)

    console.print(f"      Face detected [green]✅[/green]  (count={result.face_count})")
    console.print()

    # Step 2 — Embedding
    console.print("[bold][[2/6]] Generating face embedding...[/bold]")
    console.print("      Embedding generated [green]OK[/green]")
    console.print()

    # Step 3 — Search
    console.print("[bold][[3/6]] Searching web using Yandex...[/bold]")
    if result.search_results_count == 0 and result.error:
        console.print(f"[red]      Error: {result.error}[/red]")
        sys.exit(1)
    console.print(f"      {result.search_results_count} candidates found [green]OK[/green]")
    console.print()

    # Step 4 — Candidates
    console.print("[bold][[4/6]] Filtering / downloading candidates...[/bold]")
    console.print(f"      {result.candidates_processed} candidates processed")
    console.print()

    # Step 5 — Face verification
    console.print("[bold][[5/6]] Verifying candidate faces...[/bold]")
    if result.match_found and result.match:
        m = result.match
        console.print(f"      Best match: [cyan]{m.candidate.source}[/cyan]")
        console.print(f"      Similarity: [bold]{m.similarity:.4f}[/bold]")
        console.print("      Face match: [green]YES[/green]")
    else:
        console.print("      [yellow]No verified face match found above threshold.[/yellow]")
    console.print()

    # Step 6 — Blockchain
    console.print("[bold][[6/6]] Creating blockchain record...[/bold]")
    if result.blockchain_record:
        br = result.blockchain_record
        console.print(f"      SHA-256: [dim]{br.data_hash}[/dim]")
        console.print("      Blockchain record created [green]OK[/green]")
    else:
        console.print("      [dim]No blockchain record (no match found).[/dim]")
    console.print()

    # ---- Summary ----
    print_divider()
    console.print(Panel.fit(
        "[bold green]PIPELINE COMPLETE[/bold green]",
        border_style="green",
    ))
    print_divider()
    console.print()

    if result.match_found and result.match:
        m = result.match
        c = m.candidate

        console.print(Panel(
            f"[bold]Title       :[/bold] {c.title or 'N/A'}\n"
            f"[bold]Platform    :[/bold] {c.source}\n"
            f"[bold]URL         :[/bold] [link={c.url}]{c.url or 'N/A'}[/link]\n"
            f"[bold]Image URL   :[/bold] {c.image_url or c.thumbnail or 'N/A'}\n"
            f"[bold]Similarity  :[/bold] {m.similarity:.4f}\n"
            f"[bold]Face Match  :[/bold] [green]YES ✅[/green]",
            title="[bold green]MATCHING CONTENT FOUND[/bold green]",
            border_style="green",
        ))
        console.print()

    if result.blockchain_record:
        br = result.blockchain_record
        vr = result.verification
        console.print(Panel(
            f"[bold]Record ID   :[/bold] {br.record_id}\n"
            f"[bold]Block #     :[/bold] {br.block_index}\n"
            f"[bold]SHA-256     :[/bold] [dim]{br.data_hash}[/dim]\n"
            f"[bold]Block Hash  :[/bold] [dim]{br.block_hash[:32]}...[/dim]\n"
            f"[bold]Prev Hash   :[/bold] [dim]{br.previous_hash[:32]}...[/dim]\n"
            f"[bold]Verified    :[/bold] "
            + ("[green]VERIFIED ✅[/green]" if vr and vr.verified else "[red]FAILED ❌[/red]"),
            title="[bold cyan]BLOCKCHAIN RECORD[/bold cyan]",
            border_style="cyan",
        ))
        console.print()
        console.print(f"[dim]To verify later: python main.py verify {br.record_id}[/dim]")
    else:
        console.print("[yellow]No blockchain record created.[/yellow]")

    if result.error and not result.match_found:
        console.print(f"\n[red]Error: {result.error}[/red]")


# ---------------------------------------------------------------------------
# verify command
# ---------------------------------------------------------------------------

def cmd_verify(record_id: str):
    from src.blockchain import get_record, verify_record

    print_banner()
    console.print()

    record = get_record(record_id)
    if not record:
        console.print(f"[red]✗ No blockchain record found with id: {record_id}[/red]")
        sys.exit(1)

    console.print(f"[dim]Retrieving record: {record_id}[/dim]")
    vr = verify_record(record_id)

    result_text = (
        "[bold green]VERIFIED ✅[/bold green]"
        if vr.verified
        else "[bold red]TAMPERED ❌[/bold red]"
    )

    console.print(Panel(
        f"[bold]Stored hash :[/bold] [dim]{vr.stored_hash}[/dim]\n"
        f"[bold]Current hash:[/bold] [dim]{vr.current_hash}[/dim]\n\n"
        f"[bold]Result:[/bold]\n{result_text}",
        title="[bold cyan]BLOCKCHAIN VERIFICATION[/bold cyan]",
        border_style="cyan" if vr.verified else "red",
    ))

    sys.exit(0 if vr.verified else 1)


# ---------------------------------------------------------------------------
# chain command
# ---------------------------------------------------------------------------

def cmd_chain():
    from src.blockchain import validate_chain, _load_chain
    print_banner()
    chain = _load_chain()
    valid, msg = validate_chain()
    status = "[green]VALID ✅[/green]" if valid else "[red]INVALID ❌[/red]"
    console.print(Panel(
        f"Blocks: {len(chain)}\nStatus: {status}\nMessage: {msg}",
        title="[bold]Chain Integrity[/bold]",
    ))


# ---------------------------------------------------------------------------
# serve command
# ---------------------------------------------------------------------------

def cmd_serve():
    import uvicorn
    console.print("[cyan]Starting FastAPI server on http://localhost:8000[/cyan]")
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    args = sys.argv[1:]

    if not args:
        console.print("[yellow]Usage:[/yellow]")
        console.print("  python main.py search <image_path>")
        console.print("  python main.py verify <record_id>")
        console.print("  python main.py chain")
        console.print("  python main.py serve")
        sys.exit(0)

    cmd = args[0].lower()

    if cmd == "search":
        if len(args) < 2:
            console.print("[red]Error: provide an image path.[/red]")
            console.print("  python main.py search <image_path>")
            sys.exit(1)
        asyncio.run(cmd_search(args[1]))

    elif cmd == "verify":
        if len(args) < 2:
            console.print("[red]Error: provide a record_id.[/red]")
            console.print("  python main.py verify <record_id>")
            sys.exit(1)
        cmd_verify(args[1])

    elif cmd == "chain":
        cmd_chain()

    elif cmd == "serve":
        cmd_serve()

    else:
        console.print(f"[red]Unknown command: {cmd}[/red]")
        sys.exit(1)


if __name__ == "__main__":
    main()
