from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from shared.incidents_analysis import (  # noqa: E402
    INVALID_RULE_LABELS,
    SCORE_LABELS,
    VALID_CATEGORIES,
    VALID_STATUSES,
    analyze_csv_file,
    export_result_to_csv_bytes,
    percentage,
)


def print_summary(result: object, source_name: str) -> None:
    print("=" * 60)
    print("  NEXOVA - SUPPORT TICKET ANALYSIS")
    print(f"  Source file: {source_name}")
    print("=" * 60)
    print()
    print(f"TOTAL RECORDS IN FILE .......... {result.total_records}")
    print(f"  |- Valid records ................ {result.valid_records}")
    print(f"  '- Invalid / incomplete .......... {result.invalid_records}")
    print()
    print("INVALID RECORDS BREAKDOWN")

    invalid_entries = [
        (rule_key, label)
        for rule_key, label in INVALID_RULE_LABELS
        if result.invalid_breakdown.get(rule_key, 0) > 0
    ]

    if invalid_entries:
        for index, (rule_key, label) in enumerate(invalid_entries):
            branch = "  '-" if index == len(invalid_entries) - 1 else "  |-"
            print(f"{branch} {label:<30} {result.invalid_breakdown[rule_key]}")
    else:
        print("  '- None .......................... 0")

    print()
    print("BREAKDOWN BY CATEGORY (valid records)")
    for index, category in enumerate(VALID_CATEGORIES):
        count = result.category_counts.get(category, 0)
        branch = "  '-" if index == len(VALID_CATEGORIES) - 1 else "  |-"
        print(
            f"{branch} {category:<28} {count:>2}  ({percentage(count, result.valid_records):.1f}%)"
        )

    print()
    print("BREAKDOWN BY STATUS (valid records)")
    for index, status in enumerate(VALID_STATUSES):
        count = result.status_counts.get(status, 0)
        branch = "  '-" if index == len(VALID_STATUSES) - 1 else "  |-"
        print(
            f"{branch} {status:<28} {count:>2}  ({percentage(count, result.valid_records):.1f}%)"
        )

    print()
    print("SATISFACTION INDEX (closed tickets)")
    print(
        f"  Scored tickets: {sum(result.satisfaction_counts.values())} of {result.closed_valid_records}"
    )
    print(f"  Average score: {result.average_score:.2f} / 5.00")
    for score in range(1, 6):
        branch = "  '-" if score == 5 else "  |-"
        score_label = f"Score {score} ({SCORE_LABELS[score]})"
        print(
            f"{branch} {score_label:<33} {result.satisfaction_counts.get(score, 0):>2}"
        )

    print()
    print("=" * 60)


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python analyze.py <path-to-incidents.csv>", file=sys.stderr)
        return 1

    csv_path = Path(sys.argv[1]).expanduser()
    if not csv_path.is_absolute():
        csv_path = Path.cwd() / csv_path

    if not csv_path.exists() or not csv_path.is_file():
        print(f"Error: file not found: {csv_path}", file=sys.stderr)
        return 1

    try:
        result = analyze_csv_file(csv_path)
    except (OSError, ValueError) as error:
        print(f"Error reading file: {error}", file=sys.stderr)
        return 1

    print_summary(result, csv_path.name)
    export_choice = input("Export results to CSV? [y / n]: ").strip().lower()

    if export_choice == "y":
        output_dir = REPO_ROOT / "data" / "process"
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / "results.csv"
        output_path.write_bytes(export_result_to_csv_bytes(result))
        print(f"Results exported to {output_path.relative_to(REPO_ROOT)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
