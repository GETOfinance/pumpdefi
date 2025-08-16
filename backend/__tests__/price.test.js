const request = require('supertest')
const app = require('../server')

describe('Price routes', () => {
  it('GET /api/price/core returns mocked price', async () => {
    const res = await request(app).get('/api/price/core')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('symbol', 'CORE')
    expect(res.body).toHaveProperty('price')
  })
})

