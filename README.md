# Cashi API — Examen Final

API REST de finanzas personales con **arquitectura N-Layer**, **autenticación JWT**, **subida de comprobantes** y **deploy automático**. Cada usuario gestiona sus propias transacciones, organizadas por categorías globales, y puede adjuntar la foto del comprobante a cada movimiento.

**API pública:** https://cashi-api.antakarana.ai

**Stack:** Node.js · TypeScript · **Hono** · **Prisma 7** · Zod · **PostgreSQL** · Docker · **bcryptjs** · jsonwebtoken

---

## Video explicativo

- **Unidad 2** (CRUD + balance): https://youtu.be/0J_7l4rZoHs
- **Unidad 3** (auth + comprobantes): https://youtu.be/ftUPH_i4-14

---

## Requisitos previos

- Node.js 22.x
- Docker Desktop corriendo
- Corepack habilitado (`corepack enable`)

---

## Instalación y puesta en marcha

```bash
# 1. Dependencias
yarn install

# 2. Variables de entorno
cp .env.example .env
# Editar .env y poner una JWT_SECRET larga. En producción:
#   openssl rand -base64 32

# 3. Base de datos
docker compose up -d

# 4. Cliente Prisma y migraciones
yarn prisma:generate
yarn prisma:migrate

# 5. Servidor
yarn dev
# → http://localhost:3000
```

---

## Variables de entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `DATABASE_URL` | ✅ | Connection string de Postgres. Default: el de Docker Compose |
| `PORT` | ❌ | Puerto del servidor. Default `3000` |
| `JWT_SECRET` | ✅ | Secreto para firmar tokens. En producción: `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | ❌ | Vida del token. Default `7d` |
| `R2_ACCOUNT_ID` | ❌ | Cloudflare R2 account ID (storage opcional) |
| `R2_ACCESS_KEY_ID` | ❌ | R2 access key |
| `R2_SECRET_ACCESS_KEY` | ❌ | R2 secret |
| `R2_BUCKET_NAME` | ❌ | Nombre del bucket en R2 |
| `R2_PUBLIC_URL` | ❌ | URL pública del bucket (`https://pub-xxxxx.r2.dev`) |

Si las 5 variables `R2_*` están definidas, los uploads van a R2. Si falta cualquiera, los archivos se guardan en `./uploads/` local y se sirven en `/uploads/*`.

---

## Verificación rápida

```bash
# Registrar
TOKEN=$(curl -s -X POST localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@cashi.app","password":"demopass123"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# Crear categoría (auth)
curl -X POST localhost:3000/categories \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Sueldo"}'

# Crear 2 transacciones (auth)
curl -X POST localhost:3000/transactions \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"amount":850000,"type":"income","date":"2026-05-01T00:00:00.000Z","categoryId":1}'

curl -X POST localhost:3000/transactions \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"amount":320000,"type":"expense","date":"2026-05-03T00:00:00.000Z","categoryId":1}'

# Balance del usuario
curl -H "Authorization: Bearer $TOKEN" localhost:3000/transactions/balance
# → {"totalIncome":850000,"totalExpense":320000,"balance":530000}
```

---

## Cómo probar con Bruno

1. Instalar Bruno (`brew install --cask bruno`) y abrir la carpeta `bruno/`.
2. **Seleccionar el environment `Development`** en el dropdown arriba a la derecha. Sin esto, las requests fallan con `Invalid URL`.
3. Orden recomendado:
   1. `Auth → Register` (setea `{{token}}` automáticamente)
   2. `Categories → Create Category` (setea `{{categoryId}}`)
   3. `Transactions → Upload Receipt` (setea `{{receiptUrl}}`)
   4. `Transactions → Create Transaction` (usa `{{categoryId}}`, setea `{{transactionId}}`)
   5. `Transactions → Get Balance`
   6. `Transactions → Update Transaction` / `Delete Transaction`

Click derecho en la colección raíz → **Run** encadena toda la secuencia automáticamente.

---

## Endpoints

`✅` indica que el endpoint exige `Authorization: Bearer <token>`. Las rutas marcadas `❌` son públicas.

### Autenticación

| Auth | Método | Ruta | Descripción |
|---|---|---|---|
| ❌ | POST | `/auth/register` | Crea cuenta. Devuelve `{ token, user }` |
| ❌ | POST | `/auth/login`    | Login. Devuelve `{ token, user }` |

**Body register/login:**

```json
{ "email": "demo@cashi.app", "password": "demopass123" }
```

### Categorías (globales)

| Auth | Método | Ruta | Descripción |
|---|---|---|---|
| ✅ | GET    | `/categories`     | Lista todas (compartidas entre usuarios) |
| ✅ | GET    | `/categories/:id` | Detalle |
| ✅ | POST   | `/categories`     | Crea (cualquier usuario autenticado) |
| ✅ | PATCH  | `/categories/:id` | Actualiza |
| ✅ | DELETE | `/categories/:id` | Elimina |

### Transacciones (por usuario)

| Auth | Método | Ruta | Descripción |
|---|---|---|---|
| ✅ | GET    | `/transactions`         | Solo las del usuario autenticado |
| ✅ | GET    | `/transactions/balance` | Balance del usuario: `totalIncome / totalExpense / balance` |
| ✅ | POST   | `/transactions/upload`  | Sube comprobante (multipart). Devuelve `{ url }` |
| ✅ | GET    | `/transactions/:id`     | Detalle (404 si no existe, **403 si no es del usuario**) |
| ✅ | POST   | `/transactions`         | Crea. `userId` se toma del token, no del body |
| ✅ | PATCH  | `/transactions/:id`     | Actualiza (404/403 según corresponda) |
| ✅ | DELETE | `/transactions/:id`     | Elimina (404/403 según corresponda) |

**Body de creación de transacción:**

```json
{
  "amount": 850000,
  "type": "income",
  "description": "Sueldo mensual",
  "date": "2026-05-01T00:00:00.000Z",
  "categoryId": 1,
  "receiptUrl": "/uploads/<uuid>.png",
  "latitude": -33.4489,
  "longitude": -70.6693
}
```

`receiptUrl`, `latitude`, `longitude` son opcionales. Para obtener una `receiptUrl` válida, hacer primero `POST /transactions/upload`.

---

## Arquitectura N-Layer

```
Request
  → CORS middleware
  → Auth middleware  (lee Bearer, verifica JWT, c.set('userId', n))
  → Routes
  → Controller       (Zod safeParse, ownership check, llama al repo)
  → Repository       (única capa que habla con Prisma)
  → Base de datos
```

- `src/schemas/` — Zod schemas + tipos inferidos. No ejecuta lógica.
- `src/repositories/` — única capa que importa Prisma. Interfaz + objeto literal.
- `src/controllers/` — orquestación HTTP, validación, **ownership check**.
- `src/routes/` — mapea URLs → controllers. Sin lógica.
- `src/middlewares/` — `auth.middleware.ts` (lee token, inyecta `userId`).
- `src/lib/` — `prisma.ts` (singleton), `prisma-error.ts` (P2002/P2003/P2025 → 409/422/404), `upload.ts` (estrategia dual R2/local), `hono-env.ts` (tipos para `c.set/get`).

### Autenticación — flujo

1. Cliente: `POST /auth/register` o `/auth/login` con `{ email, password }`.
2. Controller: `bcrypt.compare` o `bcrypt.hash` + `jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn })`.
3. Cliente: envía `Authorization: Bearer <token>` en todas las requests siguientes.
4. Middleware (`auth.middleware.ts`): `jwt.verify(token, JWT_SECRET)` → `c.set('userId', Number(payload.sub))`.
5. Controller: `c.get('userId')` extrae el userId tipo-safe (`AppEnv.Variables.userId`).

Mismo mensaje "Credenciales inválidas" para email no existe y password incorrecta — no exponer qué emails están registrados.

### Ownership check — por qué en el controller

Prisma exige que el `where` de `update`/`delete` use campos `@unique` o `@id`. Filtrar por `{ id, userId }` no compila porque `userId` no es único. La solución es el patrón **buscar + verificar + operar**:

```typescript
const tx = await transactionsRepository.findById(id)
if (!tx) return c.json({ error: 'Transacción no encontrada' }, 404)
if (tx.userId !== userId) return c.json({ error: 'No autorizado' }, 403)
// ... operar
```

Este check vive en el **controller**, no en el repo. El repo no conoce reglas de propiedad — solo sirve datos.

### Storage de comprobantes — estrategia dual

`src/lib/upload.ts` valida tipo (JPEG/PNG/WebP) y tamaño (≤ 5 MB), luego:

- Si las 5 `R2_*` están definidas → sube a Cloudflare R2 con `PutObjectCommand` y devuelve la URL pública.
- Si falta cualquiera → guarda en `./uploads/<uuid>.<ext>` y devuelve `/uploads/<uuid>.<ext>`.

El controller (`uploadReceipt`) solo llama a `uploadFile(file)` — no sabe cuál estrategia se usó. Cambiar de un storage a otro no requiere tocar controllers.

---

## Estructura del proyecto

```
├── bruno/                          ← colección Bruno
├── docs/fases/u3/                  ← documentación didáctica por fase (U3)
├── prisma/
│   ├── schema.prisma               ← User, Category, Transaction, enum TransactionType
│   └── migrations/                 ← 4 migraciones versionadas
├── prisma.config.ts
├── uploads/                        ← comprobantes locales (ignorado por git)
├── src/
│   ├── index.ts                    ← entry + CORS + auth middleware + mount
│   ├── schemas/                    ← auth, categories, transactions
│   ├── repositories/               ← users, categories, transactions
│   ├── controllers/                ← auth, categories, transactions (+ uploadReceipt)
│   ├── routes/                     ← auth, categories, transactions
│   ├── middlewares/
│   │   └── auth.middleware.ts      ← lee Bearer, set userId
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── prisma-error.ts
│   │   ├── upload.ts               ← estrategia dual R2/local
│   │   └── hono-env.ts             ← AppEnv para tipos de c.set/get
│   └── generated/                  ← cliente Prisma (no editar, no commitear)
├── docker-compose.yml
├── .env.example
└── tsconfig.json
```

---

## Errores comunes

**`Can't reach database server`** — `docker compose up -d`.

**`The table "X" does not exist`** — `yarn prisma:migrate`.

**`Environment variable not found: DATABASE_URL`** — `cp .env.example .env`.

**`secretOrPrivateKey must have a value`** — Falta `JWT_SECRET` en `.env`. Setear con `openssl rand -base64 32`.

**`Cannot read properties of undefined (reading 'findMany')`** — Cliente Prisma desactualizado tras cambio de schema. Regenerar:

```bash
rm -rf src/generated/prisma && yarn prisma:generate
```

**`Token requerido` / `Token inválido o expirado`** — Falta el header `Authorization: Bearer <token>` o el token expiró (default 7d). Hacer `POST /auth/login` de nuevo.

**`c.get('userId')` es `undefined`** — `app.use(authMiddleware)` registrado **después** de `app.route(...)`. El orden importa: middlewares **antes** que routers.

**`Invalid URL` en Bruno** — El environment `Development` no está seleccionado.

**`tsx watch` no recarga cambios estructurales** — `pkill -f "tsx watch" && yarn dev`.

**R2: `InvalidAccessKeyId` / `SignatureDoesNotMatch`** — Credenciales R2 incorrectas. Regenerar el API token desde el dashboard de Cloudflare.

---

## Despliegue en producción

La API está desplegada en un **VPS propio** (`antakarana.ai`) con stack Docker. Justificación de la elección frente a Render/Railway: latencia menor para usuarios en Chile (servidor en Santiago), sin cold starts del free tier, filesystem persistente para los comprobantes (sin necesidad de R2 en esta entrega), reutilización de infraestructura ya existente (Postgres y Nginx Proxy Manager).

**URL pública:** https://cashi-api.antakarana.ai

### Infraestructura

| Componente | Detalle |
|---|---|
| Container app | `cashi-api` (Docker, imagen multi-stage Alpine) |
| BD | `cashidb` en `core_postgres` (PostgreSQL 16 con pgvector, ya existente en el VPS) |
| Reverse proxy + HTTPS | Nginx Proxy Manager con cert Let's Encrypt auto-renovado |
| Storage de comprobantes | Volumen Docker nombrado `cashi_uploads` (persistente) |
| Variables de entorno | `infra/.env.production` en el VPS (`chmod 600`, NO en repo) |

### Deploy automático

Cada `git push` a `main` dispara `.github/workflows/deploy.yml`:

1. GitHub Actions hace SSH al VPS con una key dedicada.
2. `git pull --ff-only origin main` en el VPS.
3. `docker compose build` y `up -d` (el `CMD` corre `prisma migrate deploy` antes del server).
4. `docker image prune -f` para limpiar imágenes huérfanas.
5. Smoke test interno al container; si falla, el job queda rojo.

Tiempo total por deploy: ~30 segundos.

---

## Uso de IA

Se utilizó **Claude** vía Claude Code como herramienta de apoyo puntual en tareas específicas:

- Generación de los archivos `.bru` de Bruno para no escribirlos a mano uno por uno.
- Consulta sobre el patrón correcto de import de `jsonwebtoken` con bundlers (CJS vs named imports) cuando apareció el error en runtime.
- Sugerencias de wording consistente para mensajes de error (mismo texto en los 401 de login, formato uniforme de `parsePrismaError`).
- Asistencia en la configuración de el flujo de GitHub Actions para el deploy automático.


