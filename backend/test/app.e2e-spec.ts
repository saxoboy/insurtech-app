import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Insurtech API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Catalogs ──────────────────────────────────────────

  describe('Catalogs', () => {
    it('GET /catalogs/insurance-types → returns items', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/catalogs/insurance-types')
        .expect(200);

      expect(body.items).toBeInstanceOf(Array);
      expect(body.items.length).toBeGreaterThanOrEqual(3);
      expect(body.items[0]).toHaveProperty('code');
      expect(body.items[0]).toHaveProperty('name');
    });

    it('GET /catalogs/coverages?insuranceType=AUTO → returns items', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/catalogs/coverages?insuranceType=AUTO')
        .expect(200);

      expect(body.items).toBeInstanceOf(Array);
      expect(body.items.length).toBeGreaterThanOrEqual(3);
    });

    it('GET /catalogs/locations → returns items', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/catalogs/locations')
        .expect(200);

      expect(body.items).toBeInstanceOf(Array);
      expect(body.items.length).toBeGreaterThanOrEqual(6);
    });
  });

  // ─── Quotes ────────────────────────────────────────────

  describe('Quotes', () => {
    let quoteId: string;

    it('POST /quotes → creates a quote with breakdown', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/quotes')
        .send({
          insuranceType: 'AUTO',
          coverage: 'PREMIUM',
          age: 30,
          location: 'EC-PICHINCHA',
        })
        .expect(201);

      expect(body).toHaveProperty('id');
      expect(body.status).toBe('QUOTED');
      expect(body.estimatedPremium).toBeGreaterThan(0);
      expect(body.breakdown).toBeInstanceOf(Array);
      expect(body.breakdown.length).toBe(4);
      expect(body.inputs).toEqual({
        insuranceType: 'AUTO',
        coverage: 'PREMIUM',
        location: 'EC-PICHINCHA',
        age: 30,
      });

      // BASE(50) + AGE(10) + LOCATION(15) + COVERAGE(30) = 105
      expect(body.estimatedPremium).toBe(105);

      quoteId = body.id;
    });

    it('GET /quotes/:id → returns persisted quote', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/quotes/${quoteId}`)
        .expect(200);

      expect(body.id).toBe(quoteId);
      expect(body.status).toBe('QUOTED');
      expect(body.estimatedPremium).toBe(105);
    });

    it('POST /quotes → validates required fields', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/quotes')
        .send({})
        .expect(400);

      expect(body.status).toBe(400);
      expect(body.detail).toBeInstanceOf(Array);
    });

    it('POST /quotes → validates age range (18-100)', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/quotes')
        .send({
          insuranceType: 'AUTO',
          coverage: 'ESTANDAR',
          age: 10,
          location: 'EC-PICHINCHA',
        })
        .expect(400);

      expect(body.status).toBe(400);
    });

    it('POST /quotes → validates catalog codes', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/quotes')
        .send({
          insuranceType: 'INVALID',
          coverage: 'ESTANDAR',
          age: 25,
          location: 'EC-PICHINCHA',
        })
        .expect(400);

      expect(body.status).toBe(400);
    });

    it('GET /quotes/:id → 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/quotes/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  // ─── Auth ──────────────────────────────────────────────

  describe('Auth', () => {
    it('POST /auth/login → returns JWT for valid credentials', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'demouser@correo.com', password: 'password' })
        .expect(201);

      expect(body).toHaveProperty('accessToken');
      expect(body.tokenType).toBe('Bearer');
    });

    it('POST /auth/login → 401 for invalid password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'demouser@correo.com', password: 'wrong' })
        .expect(401);
    });

    it('POST /auth/login → 401 for non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nouser@test.com', password: 'password' })
        .expect(401);
    });

    it('POST /auth/login → validates email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email', password: 'password' })
        .expect(400);
    });
  });

  // ─── Policies ──────────────────────────────────────────

  describe('Policies', () => {
    let accessToken: string;
    let quoteId: string;
    let policyId: string;

    beforeAll(async () => {
      // Login
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'demouser@correo.com', password: 'password' });
      accessToken = loginRes.body.accessToken;

      // Create quote
      const quoteRes = await request(app.getHttpServer())
        .post('/quotes')
        .send({
          insuranceType: 'SALUD',
          coverage: 'GOLD',
          age: 45,
          location: 'EC-GUAYAS',
        });
      quoteId = quoteRes.body.id;
    });

    it('POST /policies → 401 without token', async () => {
      await request(app.getHttpServer())
        .post('/policies')
        .send({ quoteId })
        .expect(401);
    });

    it('POST /policies → creates policy with valid token', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/policies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ quoteId })
        .expect(201);

      expect(body).toHaveProperty('id');
      expect(body.quoteId).toBe(quoteId);
      expect(body.status).toBe('ACTIVE');
      expect(body).toHaveProperty('issuedAt');

      policyId = body.id;
    });

    it('POST /policies → 400 double issuance same quote', async () => {
      await request(app.getHttpServer())
        .post('/policies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ quoteId })
        .expect(400);
    });

    it('GET /policies/:id → returns policy with token', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/policies/${policyId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(body.id).toBe(policyId);
      expect(body.status).toBe('ACTIVE');
    });

    it('GET /policies/:id → 401 without token', async () => {
      await request(app.getHttpServer())
        .get(`/policies/${policyId}`)
        .expect(401);
    });
  });

  // ─── Flujo completo ────────────────────────────────────

  describe('Full flow: catalog → quote → login → policy', () => {
    it('completes the entire flow', async () => {
      // 1. Get catalogs
      const typesRes = await request(app.getHttpServer())
        .get('/catalogs/insurance-types')
        .expect(200);
      const insuranceType = typesRes.body.items[0].code;

      const coveragesRes = await request(app.getHttpServer())
        .get(`/catalogs/coverages?insuranceType=${insuranceType}`)
        .expect(200);
      const coverage = coveragesRes.body.items[0].code;

      const locationsRes = await request(app.getHttpServer())
        .get('/catalogs/locations')
        .expect(200);
      const location = locationsRes.body.items[0].code;

      // 2. Create quote
      const quoteRes = await request(app.getHttpServer())
        .post('/quotes')
        .send({ insuranceType, coverage, age: 35, location })
        .expect(201);

      expect(quoteRes.body.status).toBe('QUOTED');
      expect(quoteRes.body.estimatedPremium).toBeGreaterThan(0);

      // 3. Login
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'demouser@correo.com', password: 'password' })
        .expect(201);

      const token = loginRes.body.accessToken;

      // 4. Issue policy
      const policyRes = await request(app.getHttpServer())
        .post('/policies')
        .set('Authorization', `Bearer ${token}`)
        .send({ quoteId: quoteRes.body.id })
        .expect(201);

      expect(policyRes.body.status).toBe('ACTIVE');
      expect(policyRes.body.quoteId).toBe(quoteRes.body.id);

      // 5. Verify quote is now ISSUED
      const updatedQuote = await request(app.getHttpServer())
        .get(`/quotes/${quoteRes.body.id}`)
        .expect(200);

      expect(updatedQuote.body.status).toBe('ISSUED');

      // 6. Get policy
      const getPolicyRes = await request(app.getHttpServer())
        .get(`/policies/${policyRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(getPolicyRes.body.id).toBe(policyRes.body.id);
    });
  });
});
