# Carpeta `services`

Esta carpeta contiene **todos los servicios backend** (APIs y workers en segundo plano) relacionados con la compañía para el proyecto transversal de AI Engineering.

Cada subcarpeta dentro de `services/` debe corresponder a **un servicio concreto** (por ejemplo `admin-api`, `data-processor-worker`) e incluir su propia documentación técnica y funcional.

- **Propósito principal**: centralizar toda la lógica backend, APIs y consumidores de colas que dan soporte a los casos de uso de la compañía.
- **Recomendación**: documenta en este archivo (o en sub-READMEs) los servicios que vayas añadiendo, su objetivo, tecnología usada y cómo ejecutarlos.

## Servicio de analisis de incidencias utilizando la API

Para correr este servicio se debe hacer en dos terminales:

**Terminal 1 (backend API)**

Solo en la instalacion inicial:
source .venv/bin/activate
pip install -r services/api/requirements.txt

Para cada corrida:
cd /workspaces/Laskmit-latam-aie-01-Proyecto-Final
uvicorn services.api.main:app --reload --port 8000

Importante:

Después del paso 4, deja esta terminal abierta y no escribas más ahí.
Si está bien, verás un mensaje tipo Running on http://127.0.0.1:8000.

**Terminal 2 (verificación API)**

cd /workspaces/Laskmit-latam-aie-01-Proyecto-Final
curl http://127.0.0.1:8000/api/incidents/health

Resultado esperado:

Debe responder {"status":"ok"}.

**Terminal 3 (frontend web)**

cd /workspaces/Laskmit-latam-aie-01-Proyecto-Final/uis/incidents-analyzer
python -m http.server 5500

Importante:

Esta terminal también queda ocupada mientras sirve la web.

**Abrir la interfaz**

Abre la pestaña Ports en VS Code.

OJO : REVISAR y poner visibilidad publica al puerto 8000

Abre el puerto 5500 en el navegador (Open in Browser).

En esa pantalla, en API base URL, pega la URL pública del puerto 8000 desde Ports, sustituyendo la que estaba en el campo.  Asegurarse que que la url que estaba allí no quede pegada al final.

Sube el archivo incidents-nexova.csv y pulsa Analizar archivo.



