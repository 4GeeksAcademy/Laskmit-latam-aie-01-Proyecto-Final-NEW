# SPECS — Hito 05 (Backend Inventario)

## Estructura encontrada en el repo
```text
/workspaces/Laskmit-latam-aie-01-Proyecto-Final/services/
├── README.es.md
├── README.md
└── api/
    ├── README.md
    ├── main.py
    └── requirements.txt
```

## Estructura esperada por contexto (no encontrada)
```text
services/
└── api/
    ├── main.py
    ├── database.py
    ├── models.py
    ├── schemas.py
    └── routers/
        └── inventory.py
```

## Especificaciones de hito esperadas (segun contexto)
### Entidades
- `Asset`
- `AssetEntry`
- `AssetExit`

### Reglas de negocio clave
- `current_stock = sum(entries) - sum(exits)`
- No permitir salidas superiores al stock.
- Validacion `assigned_to` segun `exit_type`.
- Uso de `user_uuid` (TinyDB) sin tabla SQL de usuarios.

### API esperada
- `GET /inventory/products`
- `POST /inventory/products`
- `GET /inventory/products/{id}`
- `POST /inventory/orders/inbound`
- `POST /inventory/orders/outbound`
- `GET /inventory/orders`

## APIs/funciones/paginas realmente presentes
- No hay rutas `/inventory` implementadas.
- No hay funciones de dominio inventario en el codigo actual.
- No hay pagina UI asociada al hito 5 en este repo.

## Criterios de reconocimiento rapido
- El hito 5 esta documentado, pero no codificado.
