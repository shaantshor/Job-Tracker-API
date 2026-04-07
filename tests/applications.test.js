require('./setup');
const request = require('supertest');
const app = require('../src/index');

describe('Applications API', () => {
  let token;

  const registerAndLogin = async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'user@example.com', password: 'password123', name: 'Test User' });
    return res.body.token;
  };

  const createApp = (overrides = {}) => request(app)
    .post('/api/applications')
    .set('Authorization', `Bearer ${token}`)
    .send({
      company: 'Google',
      role: 'Backend Engineer',
      status: 'applied',
      location: 'London',
      remote_type: 'hybrid',
      ...overrides,
    });

  beforeEach(async () => {
    token = await registerAndLogin();
  });

  describe('POST /api/applications', () => {
    it('should create an application', async () => {
      const res = await createApp();

      expect(res.status).toBe(201);
      expect(res.body.company).toBe('Google');
      expect(res.body.role).toBe('Backend Engineer');
      expect(res.body.status).toBe('applied');
      expect(res.body).toHaveProperty('id');
    });

    it('should default status to wishlist', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${token}`)
        .send({ company: 'Wise', role: 'Developer' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('wishlist');
    });

    it('should create a timeline event on creation', async () => {
      const createRes = await createApp();
      const id = createRes.body.id;

      const res = await request(app)
        .get(`/api/applications/${id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.timeline.length).toBeGreaterThanOrEqual(1);
      expect(res.body.timeline[0].event_type).toBe('created');
    });

    it('should reject missing company', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'Developer' });

      expect(res.status).toBe(422);
    });

    it('should reject without auth', async () => {
      const res = await request(app)
        .post('/api/applications')
        .send({ company: 'Test', role: 'Dev' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/applications', () => {
    beforeEach(async () => {
      await createApp({ company: 'Google', status: 'applied' });
      await createApp({ company: 'Wise', status: 'interviewing' });
      await createApp({ company: 'Revolut', status: 'applied' });
    });

    it('should list applications for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/applications')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.pagination.total).toBe(3);
    });

    it('should not return other users applications', async () => {
      const otherRes = await request(app)
        .post('/api/auth/register')
        .send({ email: 'other@example.com', password: 'password123', name: 'Other' });

      const res = await request(app)
        .get('/api/applications')
        .set('Authorization', `Bearer ${otherRes.body.token}`);

      expect(res.body.data).toHaveLength(0);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/applications?status=applied')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.data).toHaveLength(2);
      res.body.data.forEach((app) => {
        expect(app.status).toBe('applied');
      });
    });

    it('should search by company name', async () => {
      const res = await request(app)
        .get('/api/applications?search=Google')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].company).toBe('Google');
    });
  });

  describe('GET /api/applications/:id', () => {
    it('should return application with contacts and timeline', async () => {
      const createRes = await createApp();
      const id = createRes.body.id;

      // Add a contact
      await request(app)
        .post(`/api/applications/${id}/contacts`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Sarah Chen', role: 'Recruiter', email: 'sarah@google.com' });

      const res = await request(app)
        .get(`/api/applications/${id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.company).toBe('Google');
      expect(res.body.contacts).toHaveLength(1);
      expect(res.body.contacts[0].name).toBe('Sarah Chen');
      expect(res.body.timeline).toBeDefined();
      expect(Array.isArray(res.body.timeline)).toBe(true);
    });

    it('should return 404 for non-existent application', async () => {
      const res = await request(app)
        .get('/api/applications/99999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/applications/:id', () => {
    it('should update an application', async () => {
      const createRes = await createApp();
      const id = createRes.body.id;

      const res = await request(app)
        .put(`/api/applications/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ company: 'Google UK', priority: 'high' });

      expect(res.status).toBe(200);
      expect(res.body.company).toBe('Google UK');
      expect(res.body.priority).toBe('high');
    });

    it('should create timeline event on status change', async () => {
      const createRes = await createApp({ status: 'applied' });
      const id = createRes.body.id;

      await request(app)
        .put(`/api/applications/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'interviewing' });

      const res = await request(app)
        .get(`/api/applications/${id}`)
        .set('Authorization', `Bearer ${token}`);

      const statusEvents = res.body.timeline.filter((e) => e.event_type === 'status_change');
      expect(statusEvents.length).toBeGreaterThanOrEqual(1);
      expect(statusEvents[0].description).toMatch(/applied.*interviewing/i);
    });

    it('should return 404 for non-existent application', async () => {
      const res = await request(app)
        .put('/api/applications/99999')
        .set('Authorization', `Bearer ${token}`)
        .send({ company: 'Updated' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/applications/:id', () => {
    it('should delete an application', async () => {
      const createRes = await createApp();
      const id = createRes.body.id;

      const res = await request(app)
        .delete(`/api/applications/${id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);

      const getRes = await request(app)
        .get(`/api/applications/${id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getRes.status).toBe(404);
    });

    it('should return 404 for non-existent application', async () => {
      const res = await request(app)
        .delete('/api/applications/99999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/applications/stats/overview', () => {
    beforeEach(async () => {
      await createApp({ company: 'Google', status: 'applied' });
      await createApp({ company: 'Wise', status: 'interviewing' });
      await createApp({ company: 'Revolut', status: 'rejected' });
      await createApp({ company: 'Monzo', status: 'offer' });
    });

    it('should return stats overview', async () => {
      const res = await request(app)
        .get('/api/applications/stats/overview')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(4);
      expect(res.body).toHaveProperty('thisWeek');
      expect(res.body).toHaveProperty('responseRate');
      expect(res.body).toHaveProperty('statusBreakdown');
      expect(res.body.statusBreakdown.applied).toBe(1);
      expect(res.body.statusBreakdown.interviewing).toBe(1);
      expect(res.body).toHaveProperty('topCompanies');
      expect(res.body).toHaveProperty('visaSponsorship');
    });
  });
});
