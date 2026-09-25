"""Caché en memoria con TTL y decorador reutilizable.

Uso:
    @cached(ttl_seconds=30)
    def list_products(db: Session = Depends(get_supabase_db)):
        ...

    # Invalidar por patrón
    invalidate_cache("list_products")
    # o toda la caché
    invalidate_cache()
"""
from __future__ import annotations

import time
import functools
from typing import Any, Callable

_cache_store: dict[str, tuple[float, Any]] = {}
_cache_ttl: dict[str, float] = {}


def cached(ttl_seconds: float = 60):
    """Decorador para cachear resultados de funciones síncronas en memoria.

    La clave de caché se genera a partir del nombre de la función y sus
    argumentos posicionales y nominales.

    Args:
        ttl_seconds: Tiempo de vida en segundos (default 60).
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            key_parts = [func.__name__]
            key_parts.extend(str(a) for a in args)
            key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
            cache_key = ":".join(key_parts)

            now = time.time()
            if cache_key in _cache_store:
                stored_time, value = _cache_store[cache_key]
                ttl = _cache_ttl.get(cache_key, ttl_seconds)
                if now - stored_time < ttl:
                    return value

            value = func(*args, **kwargs)
            _cache_store[cache_key] = (now, value)
            _cache_ttl[cache_key] = ttl_seconds
            return value
        return wrapper
    return decorator


def invalidate_cache(pattern: str | None = None) -> None:
    """Invalida entradas de caché que contengan el patrón, o toda la caché.

    Args:
        pattern: Si se proporciona, solo se invalidan las claves que contengan
                 esta subcadena. Si es None, se limpia toda la caché.
    """
    global _cache_store, _cache_ttl
    if pattern is None:
        _cache_store.clear()
        _cache_ttl.clear()
    else:
        keys_to_delete = [k for k in _cache_store if pattern in k]
        for k in keys_to_delete:
            _cache_store.pop(k, None)
            _cache_ttl.pop(k, None)


def get_cache_stats() -> dict[str, int]:
    """Retorna estadísticas básicas de la caché (útil para debugging)."""
    now = time.time()
    active = 0
    expired = 0
    for key in _cache_store:
        stored_time, _ = _cache_store[key]
        ttl = _cache_ttl.get(key, 60)
        if now - stored_time < ttl:
            active += 1
        else:
            expired += 1
    return {
        "total_entries": len(_cache_store),
        "active_entries": active,
        "expired_entries": expired,
    }