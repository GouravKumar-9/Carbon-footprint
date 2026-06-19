const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');

// Mock groq-sdk
jest.mock('groq-sdk', () => {
  return {
    Groq: jest.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: 'Mocked GreenGuide response: focus on public transport!'
                  }
                }
              ]
            })
          }
        }
      };
    })
  };
});

describe('Express Server Integration & Authentication Tests', () => {
  let originalEnv;
  let testToken;
  const JWT_SECRET = 'carbontrack-secret-key-2026';

  beforeAll(() => {
    originalEnv = process.env.GROQ_API_KEY;
    process.env.GROQ_API_KEY = 'mock-api-key';
    // Generate valid JWT token for route protection tests
    testToken = jwt.sign({ email: 'gaurav@carbontrack.in', name: 'Gaurav' }, JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(() => {
    process.env.GROQ_API_KEY = originalEnv;
  });

  describe('Security Headers', () => {
    test('should include Helmet security headers in static requests', async () => {
      const response = await request(app).get('/');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['content-security-policy']).toBeDefined();
    });

    test('should enforce CORS restricted origins', async () => {
      const allowedOriginResponse = await request(app)
        .post('/api/chat')
        .set('Origin', 'http://localhost:3000')
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-skip-csrf', 'true')
        .send({ messages: [] });
      expect(allowedOriginResponse.headers['access-control-allow-origin']).toBe('http://localhost:3000');

      const disallowedOriginResponse = await request(app)
        .post('/api/chat')
        .set('Origin', 'http://malicious.com')
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-skip-csrf', 'true')
        .send({ messages: [] });
      expect(disallowedOriginResponse.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('Authentication protection for /api/chat', () => {
    test('should return 401 when Authorization header is missing', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Origin', 'http://localhost:3000')
        .set('x-skip-csrf', 'true')
        .send({ messages: [] });
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Token missing');
    });

    test('should return 403 when token is invalid', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Origin', 'http://localhost:3000')
        .set('Authorization', 'Bearer invalid-token-string')
        .set('x-skip-csrf', 'true')
        .send({ messages: [] });
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Invalid or expired token');
    });
  });

  describe('POST /api/login - Authentication endpoint', () => {
    test('should succeed and return token for correct credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'gaurav@carbontrack.in',
          password: 'greenplanet2026'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.name).toBe('Gaurav');
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('authToken=');
    });

    test('should be case-insensitive for email username', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'GAURAV@CarbonTrack.in',
          password: 'greenplanet2026'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });

    test('should return 401 for incorrect credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'gaurav@carbontrack.in',
          password: 'wrong-password'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid email or password');
    });

    test('should return 400 for missing email or password', async () => {
      const response1 = await request(app)
        .post('/api/login')
        .send({ email: 'gaurav@carbontrack.in' });
      expect(response1.status).toBe(400);

      const response2 = await request(app)
        .post('/api/login')
        .send({ password: 'greenplanet2026' });
      expect(response2.status).toBe(400);
    });

    test('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'invalid-email-format',
          password: 'greenplanet2026'
        });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid email format');
    });

    test('should return rate limit headers on login requests', async () => {
      const response = await request(app)
        .post('/api/login')
        .set('x-test-rate-limit', 'true')
        .send({
          email: 'gaurav@carbontrack.in',
          password: 'wrong-password'
        });
      expect(response.headers['ratelimit-limit']).toBeDefined();
    });
  });

  describe('POST /api/chat - Input Validation (Authorized)', () => {
    test('should succeed and return AI response with valid arguments', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Origin', 'http://localhost:3000')
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-skip-csrf', 'true')
        .send({
          system: 'Custom instructions',
          messages: [
            { role: 'user', content: 'Tell me about energy conservation.' }
          ]
        });
      
      expect(response.status).toBe(200);
      expect(response.body.choices[0].message.content).toContain('public transport');
    });

    test('should succeed and return AI response when authorized via HttpOnly cookie', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Origin', 'http://localhost:3000')
        .set('Cookie', [`authToken=${testToken}`])
        .set('x-skip-csrf', 'true')
        .send({
          system: 'Custom instructions',
          messages: [
            { role: 'user', content: 'Tell me about energy conservation.' }
          ]
        });
      
      expect(response.status).toBe(200);
      expect(response.body.choices[0].message.content).toContain('public transport');
    });

    test('should return 400 when messages is missing or not an array', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Origin', 'http://localhost:3000')
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-skip-csrf', 'true')
        .send({
          system: 'instructions',
          messages: 'not-an-array'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('messages must be an array');
    });

    test('should return 400 when messages have invalid properties', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Origin', 'http://localhost:3000')
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-skip-csrf', 'true')
        .send({
          messages: [
            { role: 'attacker', content: 'bad role' }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('valid role and content string');
    });
  });

  describe('Rate Limiting', () => {
    test('should return 429 when chat limit is exceeded', async () => {
      for (let i = 0; i < 30; i++) {
        await request(app)
          .post('/api/chat')
          .set('Origin', 'http://localhost:3000')
          .set('Authorization', `Bearer ${testToken}`)
          .set('x-skip-csrf', 'true')
          .set('x-test-rate-limit', 'true')
          .send({ messages: [] });
      }
      const response = await request(app)
        .post('/api/chat')
        .set('Origin', 'http://localhost:3000')
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-skip-csrf', 'true')
        .set('x-test-rate-limit', 'true')
        .send({ messages: [] });

      expect(response.status).toBe(429);
      expect(response.body.error).toContain('Too many chat requests');
    });
  });

  describe('GET /api/healthz — Liveness probe', () => {
    test('should return 200 with status ok', async () => {
      const response = await request(app).get('/api/healthz');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Input Caps — new security rules', () => {
    test('should return 413 when JSON body exceeds 50 KB', async () => {
      const largeBody = { messages: [{ role: 'user', content: 'x'.repeat(55000) }] };
      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-skip-csrf', 'true')
        .send(largeBody);
      // Express returns 413 for body-too-large
      expect([400, 413]).toContain(response.status);
    });

    test('should return 400 when messages array exceeds 40 items', async () => {
      const messages = Array.from({ length: 41 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: 'hi'
      }));
      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-skip-csrf', 'true')
        .send({ messages });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Too many messages');
    });

    test('should return 400 when a message content exceeds 4000 chars', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-skip-csrf', 'true')
        .send({ messages: [{ role: 'user', content: 'a'.repeat(4001) }] });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Message content too long');
    });

    test('should return 400 when system prompt exceeds 1500 chars', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${testToken}`)
        .set('x-skip-csrf', 'true')
        .send({
          system: 's'.repeat(1501),
          messages: [{ role: 'user', content: 'hello' }]
        });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('System prompt too long');
    });

    test('should return 400 for email longer than 254 chars', async () => {
      const longEmail = 'a'.repeat(250) + '@x.co';
      const response = await request(app)
        .post('/api/login')
        .send({ email: longEmail, password: 'greenplanet2026' });
      expect(response.status).toBe(400);
    });
  });

  describe('CSRF Validation Protection Integration', () => {
    test('should return 403 when CSRF cookie/header is missing', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Origin', 'http://localhost:3000')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ messages: [] });
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('CSRF');
    });

    test('should return 403 when CSRF cookie and header mismatch', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Origin', 'http://localhost:3000')
        .set('Authorization', `Bearer ${testToken}`)
        .set('Cookie', ['csrfToken=token-a'])
        .set('x-csrf-token', 'token-b')
        .send({ messages: [] });
      expect(response.status).toBe(403);
    });

    test('should succeed when CSRF cookie and header match', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Origin', 'http://localhost:3000')
        .set('Authorization', `Bearer ${testToken}`)
        .set('Cookie', ['csrfToken=valid-token'])
        .set('x-csrf-token', 'valid-token')
        .send({ messages: [] });
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/logout', () => {
    test('should fail logout if CSRF is missing', async () => {
      const response = await request(app)
        .post('/api/logout')
        .send();
      expect(response.status).toBe(403);
    });

    test('should clear cookies on valid logout', async () => {
      const response = await request(app)
        .post('/api/logout')
        .set('Cookie', ['csrfToken=logout-token'])
        .set('x-csrf-token', 'logout-token')
        .send();
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });
});
