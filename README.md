# Insurtech App — Quote & Bind Platform

Plataforma fullstack de seguros con flujo completo: **Catálogos → Cotización → Login → Emisión de Póliza → Consulta de Póliza**.

## Rol

**Fullstack** (Frontend + Backend integrados)

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | NestJS 11, TypeScript |
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Base de datos | PostgreSQL 15 (Docker) |
| ORM | Prisma |
| Auth | JWT (passport-jwt + @nestjs/jwt) |
| Validación BE | class-validator + class-transformer |
| Validación FE | Zod + React Hook Form |
| UI Components | shadcn/ui + Tailwind CSS |
| Estado FE | Zustand |
| Testing | Vitest + Supertest |
| CI/CD | GitHub Actions |
| Errores | Problem Details (RFC 9457) |

---

## Setup Local

### Prerrequisitos

- Node.js 22+
- Docker + Docker Compose

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd insurtech-app
```

### 2. Levantar la base de datos

```bash
docker-compose up -d
```

### 3. Configurar variables de entorno

**Backend:**
```bash
cp backend/.env.example backend/.env
# Edita backend/.env con tus valores
```

**Frontend:**
```bash
cp frontend/.env.example frontend/.env.local
# Asegúrate que NEXT_PUBLIC_API_URL apunte al backend
```

### 4. Instalar dependencias y preparar la base de datos

```bash
# Backend
cd backend
npm install
npx prisma migrate deploy
npx prisma db seed
```

```bash
# Frontend
cd frontend
npm install
```

### 5. Levantar los servidores

```bash
# Backend (puerto 4000)
cd backend && npm run start:dev

# Frontend (puerto 3000)
cd frontend && npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Variables de Entorno

### Backend (`backend/.env`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Conexión a PostgreSQL | `postgresql://postgres:postgres@localhost:5432/insurtech?schema=public` |
| `JWT_SECRET` | Clave secreta para JWT | `tu-clave-secreta` |
| `JWT_EXPIRES_IN` | Expiración del token | `1d` |
| `PORT` | Puerto del servidor | `4000` |
| `CORS_ORIGIN` | Origen permitido para CORS | `http://localhost:3000` |

### Frontend (`frontend/.env.local`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL del backend | `http://localhost:4000` |

---

## Endpoints API

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/catalogs/insurance-types` | No | Lista tipos de seguro |
| GET | `/catalogs/coverages?insuranceType=X` | No | Lista coberturas por tipo |
| GET | `/catalogs/locations` | No | Lista ubicaciones |
| POST | `/quotes` | No | Crea cotización y calcula prima |
| GET | `/quotes/:id` | No | Obtiene cotización por ID |
| POST | `/auth/register` | No | Registra nuevo usuario |
| POST | `/auth/login` | No | Inicio de sesión, retorna JWT |
| POST | `/policies` | JWT | Emite póliza desde una cotización |
| GET | `/policies/:id` | JWT | Obtiene póliza por ID |
| GET | `/policies` | JWT | Lista pólizas del usuario autenticado |

### Documentación interactiva (Swagger)

Con el backend corriendo: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

## Catálogos

### Tipos de Seguro

| Código | Nombre |
|--------|--------|
| `AUTO` | Seguro de Auto |
| `SALUD` | Seguro de Salud |
| `HOGAR` | Seguro de Hogar |

### Coberturas

| Código | Nombre | Factor Prima |
|--------|--------|-------------|
| `ESTANDAR` | Estándar | +$0 |
| `PREMIUM` | Premium | +$30 |
| `GOLD` | Gold | +$60 |

### Ubicaciones (Ecuador)

`EC-PICHINCHA`, `EC-GUAYAS`, `EC-AZUAY`, `EC-MANABI`, `EC-TUNGURAHUA`, `EC-LOJA`

---

## Cálculo de Prima

```
estimatedPremium = BASE + AGE_FACTOR + LOCATION_FACTOR + COVERAGE_FACTOR
```

| Componente | Descripción |
|-----------|-------------|
| `BASE` | AUTO=$50, SALUD=$80, HOGAR=$40 |
| `AGE_FACTOR` | <25: $20 / 25-39: $10 / 40-59: $15 / ≥60: $25 |
| `LOCATION_FACTOR` | EC-PICHINCHA: $15 / EC-GUAYAS: $12 / EC-AZUAY: $8 / EC-MANABI: $6 / EC-TUNGURAHUA: $5 / EC-LOJA: $4 |
| `COVERAGE_FACTOR` | ESTANDAR: $0 / PREMIUM: $30 / GOLD: $60 |

---

## ORM y Seed

Prisma ORM con migraciones versionadas en `backend/prisma/migrations/`.

El seed (`backend/prisma/seed.ts`) carga:
- 3 tipos de seguro
- 9 combinaciones de coberturas (3 por tipo)
- 6 ubicaciones (provincias de Ecuador)
- Usuario de prueba: `user@example.com` / `password`

```bash
# Ejecutar seed manualmente
cd backend && npx prisma db seed
```

---

## Scripts

### Backend

```bash
npm run start:dev    # Desarrollo con hot-reload
npm run build        # Compilar para producción
npm run start:prod   # Producción
npm run lint         # ESLint
npm run test         # Tests unitarios (Vitest)
npm run test:e2e     # Tests E2E (Supertest)
```

### Frontend

```bash
npm run dev          # Desarrollo
npm run build        # Build de producción
npm run start        # Producción
npm run lint         # ESLint
npm run test         # Tests (Vitest)
```

---

## Testing

### Backend

```bash
cd backend
npm run test         # Unitarios: QuotesService, cálculo de prima
npm run test:e2e     # E2E: todos los endpoints con BD real
```

### Frontend

```bash
cd frontend
npm run test         # Unitarios: premium-calculator, quote-schema, QuoteForm component
```

### CI/CD

GitHub Actions ejecuta automáticamente en push/PR a `main`:
1. Backend: lint → unit tests → E2E tests (con PostgreSQL) → build
2. Frontend: lint → tests → build

---

## Arquitectura

```
insurtech-app/
├── backend/              # NestJS API
│   ├── src/
│   │   ├── auth/         # JWT authentication
│   │   ├── catalogs/     # Insurance types, coverages, locations
│   │   ├── quotes/       # Quote creation & premium calculation
│   │   ├── policies/     # Policy issuance (JWT protected)
│   │   ├── prisma/       # PrismaService wrapper
│   │   └── common/       # Global exception filter (RFC 9457)
│   └── prisma/           # Schema, migrations, seed
├── frontend/             # Next.js App Router
│   ├── app/              # Pages (quote, policy, login, register)
│   ├── components/       # React components
│   ├── lib/              # API client, auth store (Zustand), actions
│   └── __tests__/        # Vitest tests
└── docker-compose.yml    # PostgreSQL 15
```

### Decisiones de diseño

- **NestJS monolito modular**: velocidad de entrega; módulos separables a futuro
- **Problem Details (RFC 9457)**: formato estándar de errores en toda la API
- **Zustand + cookie sync**: token en `localStorage` (cliente) y cookie HttpOnly-compatible (middleware SSR)
- **Middleware Next.js**: protección de rutas `/policy/*` en el Edge, sin round-trips al servidor
- **Prisma + transacciones**: emisión de póliza con `$transaction` para garantizar consistencia (quote ISSUED + policy creada atómicamente)
