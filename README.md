# Cashi API — Unidad 2

API REST de finanzas personales construida con arquitectura N-Layer. Permite registrar ingresos y egresos, organizarlos por categoría y consultar el balance general.

**Stack:** Node.js · TypeScript · Hono · Prisma 7 · Zod · PostgreSQL · Docker

---

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

