# Cashi API — Unidad 2

API REST de finanzas personales construida con arquitectura N-Layer. Permite registrar ingresos y egresos, organizarlos por categoría y consultar el balance general.

**Stack:** Node.js · TypeScript · Hono · Prisma 7 · Zod · PostgreSQL · Docker

> **Estado actual:** Fase 0 — esqueleto del proyecto. La lógica de negocio (categorías, transacciones, balance) se incorpora en las fases siguientes.

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

### 5. Iniciar el servidor

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

## Estructura del proyecto

```
├── bruno/                  ← colección Bruno para probar la API
├── docs/fases/             ← documentación interna por fase de desarrollo
├── prisma/
│   └── schema.prisma       ← modelos (vacío en fase 0)
├── prisma.config.ts        ← configuración de Prisma 7
├── src/
│   ├── index.ts            ← entry point (Hono + health check)
│   ├── lib/
│   │   ├── prisma.ts       ← singleton PrismaClient
│   │   └── prisma-error.ts ← mapeo de errores Prisma → HTTP
│   └── generated/          ← cliente Prisma (no editar, no commitear)
├── docker-compose.yml
├── .env.example
└── tsconfig.json
```

---

## Roadmap

- **Fase 0** — Esqueleto del proyecto (este commit)
- **Fase 1** — CRUD de categorías
- **Fase 2** — CRUD de transacciones
- **Fase 3** — Endpoint `GET /transactions/balance`
- **Fase 4** — Documentación final
