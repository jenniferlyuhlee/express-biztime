process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;

beforeEach(async () => {
    const result = await db.query(`INSERT INTO companies (code, name, description)
                                   VALUES ('sb', 'Springboard', 'Tech education')
                                   RETURNING code, name, description`)
    testCompany = result.rows[0]
})

afterEach(async () => {
    await db.query('DELETE FROM companies')
})

afterAll(async () => {
    await db.end()
})

describe ('GET /companies', () => {
    test('Get a list with one company', async () => {
        const resp = await request(app).get('/companies')
        
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({companies :[testCompany]});
    })
})

describe ('GET /companies/:code', () => {
    test('Gets a single company', async () => {
        const resp = await request(app).get(`/companies/${testCompany.code}`)
        
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({company: testCompany});
    })
    test('Responds with 404 for invalid code', async() => {
        const resp = await request(app).get('/companies/iv')

        expect(resp.statusCode).toBe(404);
    })
})

describe('POST /companies', () => {
    test('Creates a single company', async ()=> {
        const resp = await request(app).post('/companies')
        .send({code: 'ts', name: 'Test', description: 'Test company.'});
        
        expect(resp.statusCode).toBe(201);
        expect(resp.body).toEqual({company: { code: 'ts', name: 'Test', description: 'Test company.' }})
    })
})

describe('PUT /companies/:code', () => {
    test('Updates a single company', async () => {
        const resp = await request(app).put(`/companies/${testCompany.code}`)
        .send({name: 'SpringBoard', description: 'Bootcamps'})

        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({company: { code: 'sb', name: 'SpringBoard', description: 'Bootcamps' }})
    })
    test('Responds with 404 for invalid code', async() => {
        const resp = await request(app).put('/companies/iv')

        expect(resp.statusCode).toBe(404);
    })
})

describe ('DELETE /companies/:code', () => {
    test('Deletes a single company', async () => {
        const resp = await request(app).delete(`/companies/${testCompany.code}`)
    
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({ status: 'deleted' })
    })
    test('Responds with 404 for invalid code', async() => {
        const resp = await request(app).put('/companies/iv')

        expect(resp.statusCode).toBe(404);
    })
})