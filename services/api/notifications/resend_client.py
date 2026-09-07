from __future__ import annotations

from datetime import datetime
import os
from urllib.parse import quote, urlparse

import resend
from resend.exceptions import ResendError


class EmailConfigurationError(RuntimeError):
    """Indica que el cliente de correo no tiene una configuración válida."""


class EmailDeliveryError(RuntimeError):
    """Indica que el proveedor no pudo aceptar el correo."""


def _frontend_url() -> str:
    url = os.getenv("PASSWORD_RESET_FRONTEND_URL", "http://localhost:3000").rstrip("/")
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("PASSWORD_RESET_FRONTEND_URL must be an absolute HTTP(S) URL.")
    return url


def send_password_reset_email(recipient: str, token: str, expires_at: datetime) -> None:
    api_key = os.getenv("RESEND_API_KEY", "")
    if not api_key:
        raise EmailConfigurationError("Email delivery is not configured.")

    try:
        frontend_url = _frontend_url()
    except ValueError as error:
        raise EmailConfigurationError("Email delivery is not configured.") from error

    resend.api_key = api_key
    reset_url = f"{frontend_url}/reset-password?token={quote(token, safe='')}"
    expires_label = expires_at.strftime("%H:%M UTC")
    body = (
        "Recibimos una solicitud para restablecer tu contrasena de Nexova.\n\n"
        f"Abre este enlace antes de las {expires_label}:\n{reset_url}\n\n"
        "Si no solicitaste este cambio, ignora este mensaje."
    )

    try:
        resend.Emails.send(
            {
                "from": os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev"),
                "to": [recipient],
                "subject": "Restablece tu contrasena de Nexova",
                "text": body,
            }
        )
    except ResendError as error:
        raise EmailDeliveryError("Resend did not accept the email.") from error
