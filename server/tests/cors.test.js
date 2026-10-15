const app = require('../server');

describe('CORS Configuration Tests', () => {
  let server;
  let baseUrl;
  const netlifyOrigin = 'https://fantastic-bonbon-2faafd.netlify.app';
  const netlifyPreviewOrigin = 'https://deploy-preview-42--fantastic-bonbon-2faafd.netlify.app';
  const disallowedOrigin = 'https://malicious-attacker-domain.com';

  beforeAll(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('1. Exact Netlify Origin verification', () => {
    test('GET /api/stations returns CORS headers for exact Netlify origin', async () => {
      const res = await fetch(`${baseUrl}/api/stations`, {
        method: 'GET',
        headers: {
          Origin: netlifyOrigin,
        },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('access-control-allow-origin')).toBe(netlifyOrigin);
      expect(res.headers.get('access-control-allow-credentials')).toBe('true');
      expect(res.headers.get('access-control-allow-origin')).not.toBe('*');
    });

    test('GET /api/health returns CORS headers for exact Netlify origin', async () => {
      const res = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          Origin: netlifyOrigin,
        },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('access-control-allow-origin')).toBe(netlifyOrigin);
    });

    test('Netlify deploy preview subdomains are also allowed', async () => {
      const res = await fetch(`${baseUrl}/api/stations`, {
        method: 'GET',
        headers: {
          Origin: netlifyPreviewOrigin,
        },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('access-control-allow-origin')).toBe(netlifyPreviewOrigin);
    });

    test('Disallowed origin does NOT receive access-control-allow-origin header', async () => {
      const res = await fetch(`${baseUrl}/api/stations`, {
        method: 'GET',
        headers: {
          Origin: disallowedOrigin,
        },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('access-control-allow-origin')).toBeNull();
    });

    test('Requests without Origin header (e.g. server-to-server, curl) succeed normally', async () => {
      const res = await fetch(`${baseUrl}/api/stations`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('access-control-allow-origin')).toBeNull();
    });
  });

  describe('2. Preflight OPTIONS Handling & Allowed Methods', () => {
    const methodsToTest = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

    methodsToTest.forEach((method) => {
      test(`Preflight OPTIONS for ${method} receives proper CORS headers`, async () => {
        const res = await fetch(`${baseUrl}/api/stations`, {
          method: 'OPTIONS',
          headers: {
            Origin: netlifyOrigin,
            'Access-Control-Request-Method': method,
            'Access-Control-Request-Headers': 'Content-Type, Authorization',
          },
        });

        expect([200, 204]).toContain(res.status);
        expect(res.headers.get('access-control-allow-origin')).toBe(netlifyOrigin);
        expect(res.headers.get('access-control-allow-origin')).not.toBe('*');
        expect(res.headers.get('access-control-allow-credentials')).toBe('true');

        const allowedMethods = res.headers.get('access-control-allow-methods');
        expect(allowedMethods).toBeTruthy();
        expect(allowedMethods).toContain('GET');
        expect(allowedMethods).toContain('POST');
        expect(allowedMethods).toContain('PUT');
        expect(allowedMethods).toContain('PATCH');
        expect(allowedMethods).toContain('DELETE');
        expect(allowedMethods).toContain('OPTIONS');

        const allowedHeaders = res.headers.get('access-control-allow-headers');
        expect(allowedHeaders).toBeTruthy();
        expect(allowedHeaders.toLowerCase()).toContain('content-type');
        expect(allowedHeaders.toLowerCase()).toContain('authorization');
      });
    });

    test('Preflight OPTIONS on parameterized path receives CORS headers', async () => {
      const res = await fetch(`${baseUrl}/api/stations/1`, {
        method: 'OPTIONS',
        headers: {
          Origin: netlifyOrigin,
          'Access-Control-Request-Method': 'PUT',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
        },
      });

      expect([200, 204]).toContain(res.status);
      expect(res.headers.get('access-control-allow-origin')).toBe(netlifyOrigin);
    });
  });

  describe('3. CORS Headers on Error and 404 Responses', () => {
    test('404 Not Found returns CORS headers for allowed Netlify origin', async () => {
      const res = await fetch(`${baseUrl}/api/non-existent-route-for-testing`, {
        method: 'GET',
        headers: {
          Origin: netlifyOrigin,
        },
      });

      expect(res.status).toBe(404);
      expect(res.headers.get('access-control-allow-origin')).toBe(netlifyOrigin);
      const data = await res.json();
      expect(data.error).toBe('Route not found');
    });

    test('Auth failure (401) on protected route retains CORS headers', async () => {
      const res = await fetch(`${baseUrl}/api/stations`, {
        method: 'POST',
        headers: {
          Origin: netlifyOrigin,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Unauthorized Station' }),
      });

      expect(res.status).toBe(401);
      expect(res.headers.get('access-control-allow-origin')).toBe(netlifyOrigin);
    });
  });
});
