from __future__ import annotations

import io
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest.mock import patch

from scripts import analyze


class AnalyzeCliErrorHandlingTest(unittest.TestCase):
    def test_export_failure_returns_one_without_exposing_exception(self) -> None:
        csv_path = Path(__file__).resolve().parents[3] / "data" / "raw" / "incidents-nexova.csv"
        stderr = io.StringIO()

        with (
            patch.object(analyze.sys, "argv", ["analyze.py", str(csv_path)]),
            patch("builtins.input", return_value="y"),
            patch.object(Path, "write_bytes", side_effect=OSError("private disk path")),
            redirect_stdout(io.StringIO()),
            redirect_stderr(stderr),
        ):
            exit_code = analyze.main()

        self.assertEqual(exit_code, 1)
        self.assertEqual(stderr.getvalue(), "Error: unable to export results.\n")
        self.assertNotIn("private disk path", stderr.getvalue())


if __name__ == "__main__":
    unittest.main()