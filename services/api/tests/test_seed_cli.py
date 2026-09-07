from __future__ import annotations

import io
import unittest
from contextlib import redirect_stderr
from unittest.mock import patch

from services.api import seed


class SeedCliErrorHandlingTest(unittest.TestCase):
    def test_missing_credentials_returns_one_without_traceback(self) -> None:
        stderr = io.StringIO()

        with (
            patch.dict(seed.os.environ, {}, clear=True),
            redirect_stderr(stderr),
        ):
            exit_code = seed.main()

        self.assertEqual(exit_code, 1)
        self.assertEqual(
            stderr.getvalue(),
            "Error: administrator credentials are not configured.\n",
        )

    def test_database_failure_returns_sanitized_error(self) -> None:
        stderr = io.StringIO()

        with (
            patch.dict(
                seed.os.environ,
                {
                    "USUARIO_ADMINISTRADOR": "admin@example.com",
                    "CLAVE_ADMINISTRADOR": "secure-password",
                },
                clear=True,
            ),
            patch.object(seed, "get_db", side_effect=OSError("private database path")),
            redirect_stderr(stderr),
        ):
            exit_code = seed.main()

        self.assertEqual(exit_code, 1)
        self.assertEqual(stderr.getvalue(), "Error: unable to seed the administrator account.\n")
        self.assertNotIn("private database path", stderr.getvalue())


if __name__ == "__main__":
    unittest.main()