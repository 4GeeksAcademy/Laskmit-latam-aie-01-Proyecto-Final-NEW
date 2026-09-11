# Evidencias a colocar en el pull request

## Corrida del docker compose up

@Laskmit ➜ /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW (docker-compose) $ docker compose up
[+] Running 3/3
 ✔ Network laskmit-latam-aie-01-proyecto-final-new_nexova-network  Created       0.1s 
 ✔ Container nexova-backend                                        Created       0.1s 
 ✔ Container nexova-frontends                                      Created      53.5s 
Attaching to nexova-backend, nexova-frontends
nexova-backend  | === Arrancando FastAPI (puerto 8000) ===
nexova-frontends  | === Arrancando website (puerto 3000) ===
nexova-frontends  | === Arrancando backoffice (puerto 3001) ===
nexova-backend    | INFO:     Will watch for changes in these directories: ['/repo/services/api']
nexova-backend    | INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
nexova-backend    | INFO:     Started reloader process [1] using StatReload
nexova-frontends  | 
nexova-frontends  | > website@0.1.0 dev
nexova-frontends  | > next dev --port 3000
nexova-frontends  | 
nexova-frontends  | 
nexova-frontends  | > backoffice@0.1.0 dev
nexova-frontends  | > next dev --webpack --port 3001
nexova-frontends  | 
nexova-frontends  | ▲ Next.js 16.3.0 (webpack)
nexova-frontends  | - Local:         http://localhost:3001
nexova-frontends  | - Network:       http://172.18.0.3:3001
nexova-frontends  | - Environments: .env.local
nexova-frontends  | ✓ Ready in 2.8s
nexova-frontends  | ▲ Next.js 16.3.0 (Turbopack)
nexova-frontends  | - Local:         http://localhost:3000
nexova-frontends  | - Network:       http://172.18.0.3:3000
nexova-frontends  | ✓ Ready in 3.1s
nexova-frontends  | ✓ Running next.config.ts took 1514ms
nexova-frontends  | ✓ Running next.config.ts took 1465ms
nexova-backend    | INFO:     Started server process [8]
nexova-backend    | INFO:     Waiting for application startup.
nexova-frontends  | 
nexova-backend    | INFO:     Application startup complete.
nexova-frontends  | ○ Compiling / ...
nexova-frontends  | - Experiments (use with caution):
nexova-frontends  |   ✓ externalDir
nexova-frontends  | 
nexova-frontends  |  GET / 200 in 7.3s (next.js: 6.9s, application-code: 394ms)
nexova-frontends  | ○ Compiling / ...
nexova-frontends  |  GET / 200 in 13.4s (next.js: 12.9s, application-code: 436ms)
nexova-backend    | INFO:     172.18.0.1:45010 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:45018 - "GET /auth/me HTTP/1.1" 200 OK
nexova-frontends  |  GET /backoffice/inventory/products 200 in 1772ms (next.js: 1708ms, application-code: 64ms)
nexova-backend    | INFO:     172.18.0.1:50398 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:50390 - "GET /inventory/products HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:50412 - "GET /inventory/products HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:50424 - "GET /inventory/products HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:50428 - "GET /inventory/products HTTP/1.1" 200 OK
nexova-frontends  |  GET /backoffice/inventory/orders 200 in 790ms (next.js: 645ms, application-code: 145ms)
nexova-backend    | INFO:     172.18.0.1:42184 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:42188 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:42190 - "GET /inventory/orders HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:42206 - "GET /inventory/orders HTTP/1.1" 200 OK
nexova-frontends  |  GET /incidents-analyzer 200 in 686ms (next.js: 663ms, application-code: 23ms)
nexova-backend    | INFO:     172.18.0.1:43690 - "GET /auth/me HTTP/1.1" 200 OK
nexova-frontends  |  GET /incidents 200 in 809ms (next.js: 751ms, application-code: 59ms)
nexova-backend    | INFO:     172.18.0.1:43694 - "GET /api/incidents/summary HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:43702 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:43706 - "GET /api/incidents HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:43710 - "GET /api/incidents/summary HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:43716 - "GET /api/incidents HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:43714 - "GET /api/incidents/summary HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:43690 - "GET /api/incidents HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:43730 - "GET /api/incidents/summary HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:43706 - "GET /api/incidents HTTP/1.1" 200 OK
nexova-frontends  |  GET /talent-pipeline-tracker 200 in 917ms (next.js: 895ms, application-code: 22ms)
nexova-backend    | INFO:     172.18.0.1:43694 - "GET /auth/me HTTP/1.1" 200 OK
nexova-frontends  |  GET /suppliers 200 in 786ms (next.js: 763ms, application-code: 23ms)
nexova-backend    | INFO:     172.18.0.1:51274 - "OPTIONS /suppliers HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:51290 - "OPTIONS /suppliers HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:51286 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:51302 - "GET /suppliers HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:51318 - "GET /suppliers HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:51324 - "GET /suppliers HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:51332 - "GET /suppliers HTTP/1.1" 200 OK
nexova-frontends  |  GET / 200 in 56ms (next.js: 12ms, application-code: 44ms)
nexova-backend    | INFO:     172.18.0.1:46224 - "GET /auth/me HTTP/1.1" 200 OK
nexova-frontends  |  GET /account/profile 200 in 731ms (next.js: 687ms, application-code: 43ms)
nexova-backend    | INFO:     172.18.0.1:58276 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:58286 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:58300 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:58306 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend    | INFO:     172.18.0.1:58308 - "GET /auth/me HTTP/1.1" 200 OK
nexova-frontends  |  GET /account/change-password 200 in 944ms (next.js: 916ms, application-code: 28ms)
nexova-backend    | INFO:     172.18.0.1:58316 - "GET /auth/me HTTP/1.1" 200 OK
nexova-frontends  |  GET /talent-pipeline-tracker 200 in 39ms (next.js: 12ms, application-code: 27ms)
nexova-backend    | INFO:     172.18.0.1:36754 - "GET /auth/me HTTP/1.1" 200 OK



## Estado de los servicios : docker compose ps

@Laskmit ➜ /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW (docker-compose) $ docker compose ps
NAME               IMAGE                                               COMMAND          SERVICE     CREATED         STATUS         PORTS
nexova-backend     laskmit-latam-aie-01-proyecto-final-new-backend     "sh /repo/services/a…"   backend     6 minutes ago   Up 5 minutes   0.0.0.0:8000->8000/tcp, [::]:8000->8000/tcp
nexova-frontends   laskmit-latam-aie-01-proyecto-final-new-frontends   "docker-entrypoint.s…"   frontends   6 minutes ago   Up 5 minutes   0.0.0.0:3000-3001->3000-3001/tcp, [::]:3000-3001->3000-3001/tcp

## Visualizar los logs: docker compose logs -f

@Laskmit ➜ /workspaces/Laskmit-latam-aie-01-Proyecto-Final-NEW (docker-compose) $ docker compose logs -f
nexova-backend  | === Arrancando FastAPI (puerto 8000) ===
nexova-backend  | INFO:     Will watch for changes in these directories: ['/repo/services/api']
nexova-backend  | INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
nexova-backend  | INFO:     Started reloader process [1] using StatReload
nexova-backend  | INFO:     Started server process [8]
nexova-backend  | INFO:     Waiting for application startup.
nexova-backend  | INFO:     Application startup complete.
nexova-backend  | INFO:     172.18.0.1:45010 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:45018 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:50398 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:50390 - "GET /inventory/products HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:50412 - "GET /inventory/products HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:50424 - "GET /inventory/products HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:50428 - "GET /inventory/products HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:42184 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:42188 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:42190 - "GET /inventory/orders HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:42206 - "GET /inventory/orders HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:43690 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:43694 - "GET /api/incidents/summary HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:43702 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:43706 - "GET /api/incidents HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:43710 - "GET /api/incidents/summary HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:43716 - "GET /api/incidents HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:43714 - "GET /api/incidents/summary HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:43690 - "GET /api/incidents HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:43730 - "GET /api/incidents/summary HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:43706 - "GET /api/incidents HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:43694 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:51274 - "OPTIONS /suppliers HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:51290 - "OPTIONS /suppliers HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:51286 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:51302 - "GET /suppliers HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:51318 - "GET /suppliers HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:51324 - "GET /suppliers HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:51332 - "GET /suppliers HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:46224 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:58276 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:58286 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:58300 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:58306 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:58308 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:58316 - "GET /auth/me HTTP/1.1" 200 OK
nexova-backend  | INFO:     172.18.0.1:36754 - "GET /auth/me HTTP/1.1" 200 OK
nexova-frontends  | === Arrancando website (puerto 3000) ===
nexova-frontends  | === Arrancando backoffice (puerto 3001) ===
nexova-frontends  | 
nexova-frontends  | > website@0.1.0 dev
nexova-frontends  | > next dev --port 3000
nexova-frontends  | 
nexova-frontends  | 
nexova-frontends  | > backoffice@0.1.0 dev
nexova-frontends  | > next dev --webpack --port 3001
nexova-frontends  | 
nexova-frontends  | ▲ Next.js 16.3.0 (webpack)
nexova-frontends  | - Local:         http://localhost:3001
nexova-frontends  | - Network:       http://172.18.0.3:3001
nexova-frontends  | - Environments: .env.local
nexova-frontends  | ✓ Ready in 2.8s
nexova-frontends  | ▲ Next.js 16.3.0 (Turbopack)
nexova-frontends  | - Local:         http://localhost:3000
nexova-frontends  | - Network:       http://172.18.0.3:3000
nexova-frontends  | ✓ Ready in 3.1s
nexova-frontends  | ✓ Running next.config.ts took 1514ms
nexova-frontends  | ✓ Running next.config.ts took 1465ms
nexova-frontends  | 
nexova-frontends  | ○ Compiling / ...
nexova-frontends  | - Experiments (use with caution):
nexova-frontends  |   ✓ externalDir
nexova-frontends  | 
nexova-frontends  |  GET / 200 in 7.3s (next.js: 6.9s, application-code: 394ms)
nexova-frontends  | ○ Compiling / ...
nexova-frontends  |  GET / 200 in 13.4s (next.js: 12.9s, application-code: 436ms)
nexova-frontends  |  GET /backoffice/inventory/products 200 in 1772ms (next.js: 1708ms, application-code: 64ms)
nexova-frontends  |  GET /backoffice/inventory/orders 200 in 790ms (next.js: 645ms, application-code: 145ms)
nexova-frontends  |  GET /incidents-analyzer 200 in 686ms (next.js: 663ms, application-code: 23ms)
nexova-frontends  |  GET /incidents 200 in 809ms (next.js: 751ms, application-code: 59ms)
nexova-frontends  |  GET /talent-pipeline-tracker 200 in 917ms (next.js: 895ms, application-code: 22ms)
nexova-frontends  |  GET /suppliers 200 in 786ms (next.js: 763ms, application-code: 23ms)
nexova-frontends  |  GET / 200 in 56ms (next.js: 12ms, application-code: 44ms)
nexova-frontends  |  GET /account/profile 200 in 731ms (next.js: 687ms, application-code: 43ms)
nexova-frontends  |  GET /account/change-password 200 in 944ms (next.js: 916ms, application-code: 28ms)
nexova-frontends  |  GET /talent-pipeline-tracker 200 in 39ms (next.js: 12ms, application-code: 27ms)

