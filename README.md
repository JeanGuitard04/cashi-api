# Cashi API — Unidad 2

API REST de finanzas personales construida con arquitectura N-Layer. Permite registrar ingresos y egresos, organizarlos por categoría y consultar el balance general.

**Stack:** Node.js · TypeScript · Hono · Prisma 7 · Zod · PostgreSQL · Docker

---

## Video explicativo: 

https://youtu.be/0J_7l4rZoHs

---
ß
## Requisitos previos

- Node.js 22.x
- Docker Desktop corriendo
- Corepack habilitado (`corepack enable`)

---

## Instalación y puesta en marcha

### 1. Instalar dependencias

```bash
yarn install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

El `.env` por defecto apunta a la base de datos que levanta Docker:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cashidb"
```

### 3. Levantar la base de datos

```bash
docker compose up -d
```

### 4. Generar el cliente de Prisma

```bash
yarn prisma:generate
```

### 5. Correr las migraciones

```bash
yarn prisma:migrate
```

Crea las tablas en la base de datos. La primera vez pedirá un nombre para la migración, puedes escribir `init`.

### 6. Iniciar el servidor

```bash
yarn dev
```

El servidor queda disponible en `http://localhost:3000`. La ruta `GET /` responde con un health check.

---

## Scripts disponibles

| Script | Descripción |
|---|---|
| `yarn dev` | Servidor en modo desarrollo con hot reload |
| `yarn build` | Compila el proyecto con tsdown |
| `yarn start` | Corre el build compilado |
| `yarn prisma:generate` | Regenera el cliente Prisma desde el schema |
| `yarn prisma:migrate` | Crea y aplica migraciones |
| `yarn prisma:studio` | Abre Prisma Studio |

---

## Verificación rápida

Una vez levantado el servidor, este bloque crea datos de ejemplo y confirma el balance:

```bash
curl -X POST http://localhost:3000/categories \
  -H 'Content-Type: application/json' -d '{"name":"Sueldo"}'

curl -X POST http://localhost:3000/transactions \
  -H 'Content-Type: application/json' \
  -d '{"amount":850000,"type":"income","date":"2026-05-01T00:00:00.000Z","categoryId":1}'

curl -X POST http://localhost:3000/transactions \
  -H 'Content-Type: application/json' \
  -d '{"amount":320000,"type":"expense","date":"2026-05-03T00:00:00.000Z","categoryId":1}'

curl http://localhost:3000/transactions/balance
# → {"totalIncome":850000,"totalExpense":320000,"balance":530000}
```

---

## Cómo probar con Bruno

La carpeta `bruno/` contiene una colección lista para [Bruno](https://www.usebruno.com/), un cliente API open source.

1. **Instalar Bruno** — `brew install --cask bruno` o descargar desde el sitio oficial.
2. **Open Collection** — apuntar a la carpeta `bruno/` de este repo (no al archivo `bruno.json`).
3. **Seleccionar el environment "Development"** — dropdown arriba a la derecha del editor de la request. Sin este paso `{{baseUrl}}` queda sin resolver y todo falla con `Invalid URL`.

**Orden recomendado de pruebas:**

1. `Categories → Create Category` (setea `{{categoryId}}` automáticamente).
2. `Categories → Get Categories`.
3. `Transactions → Create Transaction` (usa `{{categoryId}}`, setea `{{transactionId}}`).
4. `Transactions → Get Transactions` (verifica que viene la categoría anidada).
5. `Transactions → Get Balance`.
6. `Transactions → Update Transaction` y `Delete Transaction`.

Click derecho en la colección raíz → **Run** encadena todos los requests automáticamente.

---

## Endpoints

### Categorías

| Método | Ruta | Descripción |
|---|---|---|
| GET    | `/categories`     | Lista todas las categorías |
| GET    | `/categories/:id` | Detalle de una categoría |
| POST   | `/categories`     | Crea una categoría |
| PATCH  | `/categories/:id` | Actualiza una categoría |
| DELETE | `/categories/:id` | Elimina una categoría |

### Transacciones

| Método | Ruta | Descripción |
|---|---|---|
| GET    | `/transactions`         | Lista todas las transacciones (incluye su categoría) |
| GET    | `/transactions/balance` | Balance general: totalIncome, totalExpense, balance |
| GET    | `/transactions/:id`     | Detalle de una transacción |
| POST   | `/transactions`         | Crea una transacción |
| PATCH  | `/transactions/:id`     | Actualiza una transacción |
| DELETE | `/transactions/:id`     | Elimina una transacción |

**Respuesta de `GET /transactions/balance`:**

```json
{
  "totalIncome": 850000,
  "totalExpense": 320000,
  "balance": 530000
}
```

- `totalIncome`: suma de `amount` de transacciones con `type = "income"`
- `totalExpense`: suma de `amount` de transacciones con `type = "expense"`
- `balance`: `totalIncome - totalExpense`

**Body de creación de transacción:**

```json
{
  "amount": 850000,
  "type": "income",
  "description": "Sueldo mensual",
  "date": "2026-05-01T00:00:00.000Z",
  "categoryId": 1
}
```

- `amount`: número entero positivo
- `type`: `"income"` o `"expense"`
- `description`: opcional, máximo 255 caracteres
- `date`: fecha ISO 8601
- `categoryId`: referencia a una categoría existente (si no existe, responde 422)

---

## Arquitectura N-Layer

El código está organizado en capas. Cada capa tiene una única responsabilidad y solo se comunica con la capa inmediatamente debajo.

```
Request → Routes → Controller → Repository → Base de datos
```

- `src/schemas/` — validación Zod y tipos inferidos. No ejecuta lógica.
- `src/repositories/` — única capa que habla con Prisma. Interfaz + objeto literal.
- `src/controllers/` — coordina request/response, valida con `safeParse`, captura errores Prisma.
- `src/routes/` — solo mapea URLs a controllers. Sin lógica.
- `src/lib/` — `prisma.ts` (singleton) y `prisma-error.ts` (mapeo P2002/P2003/P2025 → 409/422/404).

## Estructura del proyecto

```
├── bruno/                  ← colección Bruno para probar la API
├── docs/fases/             ← documentación interna por fase de desarrollo
├── prisma/
│   ├── schema.prisma       ← modelos Category y Transaction + enum TransactionType
│   └── migrations/         ← migraciones versionadas
├── prisma.config.ts
├── src/
│   ├── index.ts            ← entry point + mount de routers
│   ├── schemas/
│   │   ├── categories.schema.ts
│   │   └── transactions.schema.ts
│   ├── repositories/
│   │   ├── categories.repository.ts
│   │   └── transactions.repository.ts
│   ├── controllers/
│   │   ├── categories.controller.ts
│   │   └── transactions.controller.ts
│   ├── routes/
│   │   ├── categories.routes.ts
│   │   └── transactions.routes.ts
│   ├── lib/
│   │   ├── prisma.ts
│   │   └── prisma-error.ts
│   └── generated/          ← cliente Prisma (no editar, no commitear)
├── docker-compose.yml
├── .env.example
└── tsconfig.json
```

---

## Errores comunes

**`Can't reach database server`** — La BD no está corriendo. Ejecutar `docker compose up -d`.

**`The table "Transaction" does not exist`** — Faltan migraciones. Ejecutar `yarn prisma:migrate`.

**`Environment variable not found: DATABASE_URL`** — Falta el archivo `.env`. Ejecutar `cp .env.example .env`.

**`Cannot read properties of undefined (reading 'findMany')`** — El cliente Prisma quedó desactualizado tras cambiar el schema. Limpiar y regenerar:

```bash
rm -rf src/generated/prisma
yarn prisma:generate
```

**`Invalid URL` en Bruno** — El environment "Development" no está seleccionado. Arriba a la derecha del editor de la request, cambiar el dropdown `No Environment` a `Development`.

**`tsx watch` no recargó cambios estructurales** — A veces el hot reload no detecta cambios en archivos de routes/index. Reiniciar manualmente:

```bash
pkill -f "tsx watch src/index.ts"
yarn dev
```

---

## Uso de IA

Este proyecto fue desarrollado con apoyo de **Claude Sonnet 4.6** vía Claude Code, en las siguientes situaciones:

- **Asesoría técnica** - Consultas puntuales sobre detalles del repositorio de referencia.
- **CRUD de transacciones** — validación de fechas con `z.coerce.date()`, y el patrón `include` para traer la categoría anidada.
- **Bug de Endpoint de balance** — Asesoramiento sobre el orden de declaración de rutas (`/balance` antes de `/:id`).
- **Generar archivos Bruno** - para cada metodo CRUD de las entidades + balance.


