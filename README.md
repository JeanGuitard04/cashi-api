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
│   ├── schema.prisma       ← modelo Category (Transaction se agrega en fase 2)
│   └── migrations/         ← migraciones versionadas
├── prisma.config.ts
├── src/
│   ├── index.ts            ← entry point + mount de routers
│   ├── schemas/
│   │   └── categories.schema.ts
│   ├── repositories/
│   │   └── categories.repository.ts
│   ├── controllers/
│   │   └── categories.controller.ts
│   ├── routes/
│   │   └── categories.routes.ts
│   ├── lib/
│   │   ├── prisma.ts
│   │   └── prisma-error.ts
│   └── generated/          ← cliente Prisma (no editar, no commitear)
├── docker-compose.yml
├── .env.example
└── tsconfig.json
```

---

