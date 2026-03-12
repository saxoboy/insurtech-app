# Roadmap: Insurtech Quote & Bind — Fullstack

> **Deadline:** Jueves 12 de marzo 2026, 6:00 PM  
> **Ruta:** Fullstack (Frontend + Backend integrados)  
> **Dedicación:** 8+ horas/día (~22h disponibles)

---

## Resumen

Plataforma insurtech fullstack (NestJS 11 + Next.js 16 + PostgreSQL 15) con flujo completo:  
**Catálogos → Cotización → Login → Emisión de Póliza → Consulta de Póliza**

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | NestJS 11, TypeScript |
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Base de datos | PostgreSQL 15 (Docker) |
| ORM | Prisma |
| Auth | JWT (@nestjs/jwt, passport-jwt, bcrypt) |
| Validación BE | class-validator + class-transformer |
| Validación FE | Zod + React Hook Form |
| UI Components | shadcn/ui (base-maia) + HugeIcons |
| Estado FE | Zustand |
| Testing | Vitest + Supertest |
| CI/CD | GitHub Actions |
| Error Format | Problem Details (RFC 9457) |
| Types compartidos | shared/ + tsconfig path aliases |

---

## Decisiones de Arquitectura

| Decisión | Elección | Justificación |
|----------|----------|---------------|
| Estructura | Monolito modular NestJS | Velocidad de entrega; módulos separables a futuro |
| Testing | Vitest (no Jest) | Alineado al documento de evaluación |
| Coberturas | ESTANDAR / PREMIUM / GOLD | 3 niveles claros por tipo de seguro (9 combinaciones) |
| Monorepo tooling | shared/ + path aliases | Sin Nx ni pnpm-workspace; minimizar overhead |
| Estado frontend | Zustand | Lightweight para auth token |
| Formularios | React Hook Form + Zod | Estándar moderno con validación tipada |
| Errores | RFC 9457 (Problem Details) | Formato estándar para APIs REST |

---

## Endpoints (Contratos API)

| Método | Ruta | Auth | Request Body | Response |
|--------|------|------|-------------|----------|
| GET | /catalogs/insurance-types | No | — | `{ items: [{ code, name }] }` |
| GET | /catalogs/coverages?insuranceType=X | No | — | `{ items: [{ code, name }] }` |
| GET | /catalogs/locations | No | — | `{ items: [{ code, name }] }` |
| POST | /quotes | No | `{ insuranceType, coverage, age, location }` | `{ id, status, inputs, estimatedPremium, breakdown, createdAt }` |
| GET | /quotes/{id} | No | — | (misma estructura que POST) |
| POST | /auth/login | No | `{ email, password }` | `{ accessToken, tokenType }` |
| POST | /policies | JWT | `{ quoteId }` | `{ id, quoteId, status, issuedAt }` |
| GET | /policies/{id} | JWT | — | (misma estructura que POST) |

### Catálogos (Seed Data)

- **Tipos de seguro:** AUTO, SALUD, HOGAR
- **Coberturas:** ESTANDAR, PREMIUM, GOLD (por cada tipo = 9 combinaciones)
- **Ubicaciones:** EC-AZUAY, EC-PICHINCHA, EC-GUAYAS, etc.
- **Usuario seed:** user@example.com / password

### Cálculo de Prima

```
estimatedPremium = BASE + AGE_FACTOR + LOCATION_FACTOR + COVERAGE_FACTOR
```

Los factores varían según tipo de seguro, cobertura, ubicación y rango de edad.

---

## Estado Actual

### ✅ Completado
- [x] NestJS 11 scaffolding (backend/)
- [x] Prisma ORM configurado (sin modelos aún)
- [x] PostgreSQL 15 en Docker (docker-compose.yml)
- [x] Next.js 16 + React 19 scaffolding (frontend/)
- [x] Tailwind CSS 4 configurado
- [x] shadcn/ui (base-maia) con Button component
- [x] ESLint + Prettier en ambos proyectos
- [x] TypeScript en ambos proyectos
- [x] Layout con fuentes (Figtree, Geist)
- [x] HugeIcons configurados
- [x] lib/utils.ts (cn helper)

---

## FASE 1: Backend Core (~6h)
> **Cuándo:** Martes 10 de marzo — tarde  
> **Objetivo:** API funcional con todos los endpoints, base de datos y seed.

### 1.1 — Modelos Prisma + Seed (~1.5h)
- Diseñar schema: User, InsuranceType, Coverage, Location, Quote, QuoteBreakdown, Policy
- Relaciones: Quote → hasMany → QuoteBreakdown, Policy → belongsTo → Quote (unique)
- Coverage depende de InsuranceType
- Seed: catálogos + usuario de prueba (bcrypt hash)
- `npx prisma migrate dev` + `npx prisma db seed`
- **Archivos:** `prisma/schema.prisma`, `prisma/seed.ts`

### 1.2 — Catalogs Module (~0.5h)
- GET /catalogs/insurance-types → lista desde DB
- GET /catalogs/coverages?insuranceType=... → filtrado por tipo
- GET /catalogs/locations → lista desde DB
- Formato: `{ items: [{ code, name }] }`
- **Archivos:** `src/catalogs/catalogs.module.ts`, `catalogs.controller.ts`, `catalogs.service.ts`

### 1.3 — Quote Module (~1.5h)
- POST /quotes: validar inputs → calcular prima → persistir quote + breakdown → retornar
- GET /quotes/{id}: retornar quote con breakdown
- Lógica: BASE + AGE_FACTOR + LOCATION_FACTOR + COVERAGE_FACTOR
- DTOs con class-validator: insuranceType, coverage (strings required), age (int 18-100), location (string required)
- **Archivos:** `src/quotes/quotes.module.ts`, `quotes.controller.ts`, `quotes.service.ts`, `dto/create-quote.dto.ts`

### 1.4 — Auth Module (~1h)
- POST /auth/login: validar email + password → retornar JWT
- JwtStrategy + JwtAuthGuard
- Deps: @nestjs/jwt, @nestjs/passport, passport-jwt, bcrypt
- .env: JWT_SECRET, JWT_EXPIRATION
- **Archivos:** `src/auth/auth.module.ts`, `auth.controller.ts`, `auth.service.ts`, `jwt.strategy.ts`, `jwt-auth.guard.ts`

### 1.5 — Policy Module (~1h)
- POST /policies (protegido): recibir quoteId → validar quote QUOTED → crear policy ACTIVE
- GET /policies/{id} (protegido): retornar póliza
- Unique constraint: no doble emisión por quoteId
- Ambos con @UseGuards(JwtAuthGuard)
- **Archivos:** `src/policies/policies.module.ts`, `policies.controller.ts`, `policies.service.ts`, `dto/create-policy.dto.ts`

### 1.6 — Error Handling + Swagger + .env (~0.5h)
- Global exception filter (Problem Details)
- ValidationPipe global (whitelist + transform)
- Swagger setup en main.ts
- .env.example
- **Archivos:** `src/main.ts`, `src/common/filters/http-exception.filter.ts`, `.env.example`

### ✔ Verificación Fase 1
Probar todos los endpoints con Swagger UI o curl:  
catálogos → quote → login → policy

---

## FASE 2: Frontend Core (~8h)
> **Cuándo:** Miércoles 11 de marzo  
> **Objetivo:** UI completa con flujo Quote → Bind funcional conectado al backend real.

### 2.1 — Setup Base (~1h)
- Instalar: react-hook-form, zod, @hookform/resolvers, zustand
- API client (lib/api.ts): fetch + base URL + auth interceptor + error handling
- Auth store: login(), logout(), token, isAuthenticated
- .env.local: NEXT_PUBLIC_API_URL
- **Archivos:** `lib/api.ts`, `lib/auth-store.ts`, `.env.example`

### 2.2 — Layout + Navegación (~0.5h)
- Navbar: logo, links (Cotizar, Mis Pólizas), Login/Logout
- Layout responsive
- **Archivos:** `components/navbar.tsx`, `app/layout.tsx`

### 2.3 — Página de Login (~1h)
- Formulario email + password (RHF + Zod)
- POST /auth/login → guardar token → redirect
- Mensajes de error claros
- **Archivos:** `app/login/page.tsx`

### 2.4 — Página de Cotización (~2h)
- Formulario: tipo de seguro, cobertura (dependiente), edad, ubicación
- Carga de catálogos al montar
- Al cambiar tipo → recargar coberturas
- Validación Zod: age 18-100, todos required, valores en catálogo
- Loading states en dropdowns
- Submit → POST /quotes → navegar a resultado
- **Archivos:** `app/quote/page.tsx`, `lib/schemas/quote-schema.ts`

### 2.5 — Página de Resultado (~1.5h)
- Mostrar: inputs, prima total, breakdown desglosado
- Botón "Emitir Póliza" (solo si autenticado, sino "Inicia sesión")
- Dialog de confirmación antes de emitir
- POST /policies → navegar a detalle
- Loading state en emisión
- **Archivos:** `app/quote/[id]/page.tsx`

### 2.6 — Página de Detalle de Póliza (~0.5h)
- GET /policies/{id} → mostrar id, quoteId, status, issuedAt
- Protegida: redirect a login si no hay token
- **Archivos:** `app/policy/[id]/page.tsx`

### 2.7 — Componentes UI Adicionales (~1h)
- shadcn: Input, Label, Select, Card, Dialog, Alert, Skeleton, Badge
- Componentes custom: ErrorBanner, LoadingSpinner, ConfirmDialog
- **Archivos:** `components/ui/...`, `components/error-banner.tsx`

### 2.8 — Protección de Rutas + Polish (~0.5h)
- Middleware/wrapper para rutas protegidas (/policy/*)
- Ocultar "Emitir Póliza" sin sesión
- Accesibilidad: labels, role="alert", navegación por teclado

### ✔ Verificación Fase 2
Flujo completo en browser:  
catálogos cargan → formulario → ver prima → login → emitir póliza → ver detalle

---

## FASE 3: Quality & Testing (~4h)
> **Cuándo:** Jueves 12 de marzo — mañana  
> **Objetivo:** Tests, CI/CD, logging, documentación.

### 3.1 — Tests Backend (~2h)
- Configurar Vitest + Supertest
- Tests unitarios: QuoteService (cálculo de prima), validación catálogos
- Tests integración: POST /quotes (happy + error), POST /policies (con/sin auth, doble emisión)
- **Archivos:** `src/quotes/quotes.service.spec.ts`, `test/quotes.e2e-spec.ts`, `test/policies.e2e-spec.ts`

### 3.2 — Tests Frontend (~1h)
- Configurar Vitest para Next.js
- Test formulario de cotización (render, validación, submit)
- Test flujo principal (cotizar → resultado → emitir)
- **Archivos:** `__tests__/quote-form.test.tsx`, `vitest.config.ts`

### 3.3 — CI/CD Pipeline (~0.5h)
- GitHub Actions: install → lint → test → build (ambos proyectos)
- PostgreSQL service container para tests de integración
- **Archivos:** `.github/workflows/ci.yml`

### 3.4 — README + .env.example (~0.5h)
- README completo: ruta elegida, arquitectura, setup local, variables, endpoints, catálogos, ORM/seed, scripts, testing
- .env.example en backend y frontend
- **Archivos:** `README.md`

### ✔ Verificación Fase 3
CI pipeline pasa (lint + tests + build). README permite clonar y levantar el proyecto.

---

## FASE 4: Polish & Entrega (~2h)
> **Cuándo:** Jueves 12 de marzo — tarde  
> **Objetivo:** Pulir detalles, verificar criterios, entregar.

### 4.1 — Verificación de Criterios (~1h)
- Revisar TODOS los criterios de aceptación uno por uno
- Fix de bugs encontrados
- Flujo E2E completo: catálogos → quote → login → policy → consultar

### 4.2 — Logging + Últimos Detalles (~0.5h)
- Logger de NestJS en cada service
- Verificar: no hay secretos hardcodeados

### 4.3 — Push Final (~0.5h)
- Commit limpio, push a GitHub
- Verificar CI en GitHub Actions

---

## Criterios de Aceptación (Checklist Final)

### Generales
- [ ] Catálogos disponibles y consumidos/validados correctamente
- [ ] Contratos REST consistentes y estables
- [ ] Validación de inputs (requeridos, rangos, catálogos)
- [ ] Manejo consistente de errores (formato único)
- [ ] README reproducible y completo
- [ ] CI/CD ejecuta correctamente

### Fullstack — Backend
- [ ] POST /quotes crea cotización + prima + breakdown; persiste
- [ ] GET /quotes/{id} retorna cotización persistida
- [ ] POST /policies emite póliza; requiere token (401/403)
- [ ] GET /policies/{id} retorna póliza; requiere token
- [ ] POST /auth/login retorna token JWT
- [ ] Catálogos expuestos por API y validados en POST /quotes
- [ ] ORM: schema + seed en repositorio
- [ ] Swagger/OpenAPI disponible
- [ ] Tests mínimos API

### Fullstack — Frontend
- [ ] Flujo completo UI → API real: cotizar → ver resultado → emitir póliza
- [ ] No emitir/consultar pólizas sin autenticación
- [ ] Catálogos consumidos desde backend real
- [ ] Errores de API reflejados en UI
- [ ] Tests mínimos UI
- [ ] Formulario con carga de catálogos y validaciones
- [ ] Prima y breakdown visibles
- [ ] Estados de carga y errores visibles
- [ ] Accesibilidad básica
