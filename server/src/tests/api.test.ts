import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../db';

describe('Calculations API Integration Tests', () => {
  beforeAll(async () => {
    await prisma.splitShare.deleteMany({});
    await prisma.splitCalculation.deleteMany({});
  });

  afterAll(async () => {
    await prisma.splitShare.deleteMany({});
    await prisma.splitCalculation.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.splitShare.deleteMany({});
    await prisma.splitCalculation.deleteMany({});
  });

  it('GET /api/health should return ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /api/calculations creates and persists a calculation with correct split', async () => {
    const payload = {
      billAmount: '10.03',
      tipPercentage: 15,
      peopleCount: 3,
    };

    const res = await request(app).post('/api/calculations').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.billCents).toBe(1003);
    expect(data.tipPercentage).toBe(15);
    expect(data.tipCents).toBe(150);
    expect(data.grandTotalCents).toBe(1153);
    expect(data.peopleCount).toBe(3);
    expect(data.baseShareCents).toBe(384);
    expect(data.remainderCents).toBe(1);
    expect(data.shares).toHaveLength(3);
    expect(data.shares[0].finalShareCents).toBe(385);
    expect(data.shares[1].finalShareCents).toBe(384);
    expect(data.shares[2].finalShareCents).toBe(384);

    // Verify invariant in persisted DB record
    const totalSharesInResponse = data.shares.reduce(
      (sum: number, s: { finalShareCents: number }) => sum + s.finalShareCents,
      0
    );
    expect(totalSharesInResponse).toBe(1153);

    // Check DB directly
    const dbRecord = await prisma.splitCalculation.findUnique({
      where: { id: data.id },
      include: { shares: true },
    });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.shares).toHaveLength(3);
  });

  it('GET /api/calculations returns calculation history', async () => {
    await request(app).post('/api/calculations').send({
      billAmount: 12,
      tipPercentage: 0,
      peopleCount: 3,
    });

    await request(app).post('/api/calculations').send({
      billAmount: '20.50',
      tipPercentage: 10,
      peopleCount: 2,
    });

    const res = await request(app).get('/api/calculations');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  it('GET /api/calculations/:id returns single calculation', async () => {
    const createRes = await request(app).post('/api/calculations').send({
      billAmount: '15.00',
      tipPercentage: 20,
      peopleCount: 4,
    });

    const id = createRes.body.data.id;

    const res = await request(app).get(`/api/calculations/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(id);
    expect(res.body.data.shares).toHaveLength(4);
  });

  it('GET /api/calculations/:id returns 404 for non-existent ID', async () => {
    const res = await request(app).get('/api/calculations/non-existent-uuid');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('PUT /api/calculations/:id updates calculation and recalculates shares', async () => {
    const createRes = await request(app).post('/api/calculations').send({
      billAmount: '10.00',
      tipPercentage: 0,
      peopleCount: 2,
    });

    const id = createRes.body.data.id;

    const updateRes = await request(app)
      .put(`/api/calculations/${id}`)
      .send({
        billAmount: '10.03',
        tipPercentage: 0,
        peopleCount: 3,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.peopleCount).toBe(3);
    expect(updateRes.body.data.remainderCents).toBe(1);
    expect(updateRes.body.data.shares).toHaveLength(3);
  });

  it('DELETE /api/calculations/:id deletes calculation and associated shares', async () => {
    const createRes = await request(app).post('/api/calculations').send({
      billAmount: '30.00',
      tipPercentage: 15,
      peopleCount: 3,
    });

    const id = createRes.body.data.id;

    const deleteRes = await request(app).delete(`/api/calculations/${id}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    const checkGet = await request(app).get(`/api/calculations/${id}`);
    expect(checkGet.status).toBe(404);

    const dbShares = await prisma.splitShare.findMany({
      where: { calculationId: id },
    });
    expect(dbShares).toHaveLength(0);
  });

  it('POST /api/calculations rejects invalid inputs with structured error response', async () => {
    // Negative bill
    const res1 = await request(app).post('/api/calculations').send({
      billAmount: -10,
      tipPercentage: 15,
      peopleCount: 3,
    });
    expect(res1.status).toBe(400);
    expect(res1.body.success).toBe(false);
    expect(res1.body.error.code).toBe('VALIDATION_ERROR');

    // Decimal people count
    const res2 = await request(app).post('/api/calculations').send({
      billAmount: 10,
      tipPercentage: 15,
      peopleCount: 2.5,
    });
    expect(res2.status).toBe(400);
    expect(res2.body.success).toBe(false);

    // Negative tip
    const res3 = await request(app).post('/api/calculations').send({
      billAmount: 10,
      tipPercentage: -5,
      peopleCount: 3,
    });
    expect(res3.status).toBe(400);
    expect(res3.body.success).toBe(false);

    // More than 2 decimal places
    const res4 = await request(app).post('/api/calculations').send({
      billAmount: '10.005',
      tipPercentage: 15,
      peopleCount: 3,
    });
    expect(res4.status).toBe(400);
    expect(res4.body.success).toBe(false);
  });
});
