process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
let testInvoice;

beforeEach(async () => {
    const company = await db.query(`INSERT INTO companies (code, name, description)
                                   VALUES ('sb', 'Springboard', 'Tech education')
                                   RETURNING code, name, description`)

    testCompany= company.rows[0]

    const inv = await db.query(`INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
                                VALUES ('sb', 100, false, '2018-01-01', null)
                                RETURNING id, comp_code, amt, paid, add_date, paid_date`);
    testInvoice = inv.rows[0]
})

afterEach(async () => {
    await db.query("DELETE FROM invoices");
    await db.query("DELETE FROM companies");
})

afterAll(async () => {
    await db.end()
})

describe ('GET /invoices', () => {
    test('Get a list with one invoice', async () => {
        const resp = await request(app).get('/invoices')
        
        expect(resp.statusCode).toBe(200);
        const altTestInvoice = {
            id: expect.any(Number),
            comp_code: testInvoice.comp_code,
        }
        expect(resp.body).toEqual({invoices :[altTestInvoice]});
    })
})

describe ('GET /invoices/:id', () => {
    test('Gets a single invoice', async () => {
        const resp = await request(app).get(`/invoices/${testInvoice.id}`)
        
        expect(resp.statusCode).toBe(200);
        const altTestInvoice = {
            id: testInvoice.id, 
            amt: testInvoice.amt,
            paid: testInvoice.paid,
            add_date: '2018-01-01T08:00:00.000Z',
            paid_date: testInvoice.paid_date,
            company: {
                code: testCompany.code,
                name: testCompany.name, 
                description: testCompany.description
            }
        };
        expect(resp.body).toEqual({invoice: altTestInvoice});
    })
    test('Responds with 404 for invalid invoice id', async() => {
        const resp = await request(app).get('/invoices/10000')

        expect(resp.statusCode).toBe(404);
    })
})

describe('POST /invoices', () => {
    test('Creates a single invoice', async ()=> {
        const resp = await request(app).post('/invoices')
        .send({comp_code: 'sb', amt: 200});
        
        expect(resp.statusCode).toBe(201);
        
        const altTestInvoice = {
            id: expect.any(Number),
            comp_code: 'sb',
            amt: 200,
            paid: false,
            add_date: expect.any(String),
            paid_date: null
            
        }
        expect(resp.body).toEqual({invoice: altTestInvoice})
    })
})


describe('PUT /invoices/:id', () => {
    test('Updates a single invoice when paid', async () => {
        const resp = await request(app).put(`/invoices/${testInvoice.id}`)
        .send({amt: '100', paid: true})

        expect(resp.statusCode).toBe(200);

        const altTestInvoice = {
            id: expect.any(Number),
            comp_code: 'sb',
            amt: 100,
            paid: true,
            add_date: expect.any(String),
            paid_date: expect.any(String)
            
        }
        expect(resp.body).toEqual({invoice: altTestInvoice})
    })
    test('Responds with 404 for invalid code', async() => {
        const resp = await request(app).put('/companies/iv')

        expect(resp.statusCode).toBe(404);
    })
})


describe ('DELETE /invoices/:code', () => {
    test('Deletes a single invoice', async () => {
        const resp = await request(app).delete(`/invoices/${testInvoice.id}`)
    
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({ status: 'deleted' })
    })
    test('Responds with 404 for invalid id', async() => {
        const resp = await request(app).put('/invoices/100000')

        expect(resp.statusCode).toBe(404);
    })
})