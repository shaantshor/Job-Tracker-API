const pool = require('../config/db');

const VALID_SORT_FIELDS = ['created_at', 'updated_at', 'company', 'role', 'status', 'applied_date', 'priority'];
const VALID_ORDER = ['asc', 'desc'];

const list = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      status, search, sort = 'created_at', order = 'desc', page = 1, limit = 20,
    } = req.query;

    const conditions = ['a.user_id = $1'];
    const params = [userId];
    let paramIndex = 2;

    if (status) {
      conditions.push(`a.status = $${paramIndex}`);
      params.push(status);
      paramIndex += 1;
    }

    if (search) {
      conditions.push(`(a.company ILIKE $${paramIndex} OR a.role ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex += 1;
    }

    const sortField = VALID_SORT_FIELDS.includes(sort) ? sort : 'created_at';
    const sortOrder = VALID_ORDER.includes(order?.toLowerCase()) ? order.toLowerCase() : 'desc';
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const whereClause = conditions.join(' AND ');

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM applications a WHERE ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(
      `SELECT a.* FROM applications a WHERE ${whereClause} ORDER BY a.${sortField} ${sortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limitNum, offset],
    );

    return res.json({
      data: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    return next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const appResult = await pool.query(
      'SELECT * FROM applications WHERE id = $1 AND user_id = $2',
      [id, userId],
    );

    if (appResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const [contacts, timeline] = await Promise.all([
      pool.query('SELECT * FROM contacts WHERE application_id = $1 ORDER BY created_at', [id]),
      pool.query('SELECT * FROM timeline_events WHERE application_id = $1 ORDER BY event_date DESC', [id]),
    ]);

    return res.json({
      ...appResult.rows[0],
      contacts: contacts.rows,
      timeline: timeline.rows,
    });
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      company, role, url, status, salary_min, salary_max, currency,
      location, remote_type, visa_sponsorship, notes, applied_date,
      response_date, priority,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO applications (user_id, company, role, url, status, salary_min, salary_max, currency, location, remote_type, visa_sponsorship, notes, applied_date, response_date, priority)
       VALUES ($1, $2, $3, $4, COALESCE($5, 'wishlist'), $6, $7, COALESCE($8, 'GBP'), $9, $10, COALESCE($11, false), $12, $13, $14, COALESCE($15, 'medium'))
       RETURNING *`,
      [userId, company, role, url, status, salary_min, salary_max, currency, location, remote_type, visa_sponsorship, notes, applied_date, response_date, priority],
    );

    const app = result.rows[0];

    await pool.query(
      'INSERT INTO timeline_events (application_id, event_type, description) VALUES ($1, $2, $3)',
      [app.id, 'created', `Application created for ${company} — ${role}`],
    );

    return res.status(201).json(app);
  } catch (err) {
    return next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await pool.query(
      'SELECT * FROM applications WHERE id = $1 AND user_id = $2',
      [id, userId],
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const old = existing.rows[0];
    const {
      company, role, url, status, salary_min, salary_max, currency,
      location, remote_type, visa_sponsorship, notes, applied_date,
      response_date, priority,
    } = req.body;

    const result = await pool.query(
      `UPDATE applications SET
        company = COALESCE($1, company),
        role = COALESCE($2, role),
        url = COALESCE($3, url),
        status = COALESCE($4, status),
        salary_min = COALESCE($5, salary_min),
        salary_max = COALESCE($6, salary_max),
        currency = COALESCE($7, currency),
        location = COALESCE($8, location),
        remote_type = COALESCE($9, remote_type),
        visa_sponsorship = COALESCE($10, visa_sponsorship),
        notes = COALESCE($11, notes),
        applied_date = COALESCE($12, applied_date),
        response_date = COALESCE($13, response_date),
        priority = COALESCE($14, priority),
        updated_at = NOW()
      WHERE id = $15 AND user_id = $16
      RETURNING *`,
      [company, role, url, status, salary_min, salary_max, currency, location, remote_type, visa_sponsorship, notes, applied_date, response_date, priority, id, userId],
    );

    const updated = result.rows[0];

    if (status && status !== old.status) {
      await pool.query(
        'INSERT INTO timeline_events (application_id, event_type, description) VALUES ($1, $2, $3)',
        [id, 'status_change', `Status changed from ${old.status} to ${status}`],
      );
    }

    return res.json(updated);
  } catch (err) {
    return next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM applications WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    return res.json({ message: 'Application deleted' });
  } catch (err) {
    return next(err);
  }
};

const stats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [totalResult, weekResult, statusResult, companyResult, visaResult] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM applications WHERE user_id = $1', [userId]),
      pool.query(
        "SELECT COUNT(*) FROM applications WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'",
        [userId],
      ),
      pool.query(
        'SELECT status, COUNT(*) as count FROM applications WHERE user_id = $1 GROUP BY status',
        [userId],
      ),
      pool.query(
        'SELECT company, COUNT(*) as count FROM applications WHERE user_id = $1 GROUP BY company ORDER BY count DESC LIMIT 10',
        [userId],
      ),
      pool.query(
        'SELECT visa_sponsorship, COUNT(*) as count FROM applications WHERE user_id = $1 GROUP BY visa_sponsorship',
        [userId],
      ),
    ]);

    const total = parseInt(totalResult.rows[0].count, 10);
    const thisWeek = parseInt(weekResult.rows[0].count, 10);

    const statusBreakdown = {};
    statusResult.rows.forEach((row) => {
      statusBreakdown[row.status] = parseInt(row.count, 10);
    });

    const responded = Object.entries(statusBreakdown)
      .filter(([s]) => !['wishlist', 'applied'].includes(s))
      .reduce((sum, [, count]) => sum + count, 0);
    const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

    return res.json({
      total,
      thisWeek,
      responseRate,
      statusBreakdown,
      topCompanies: companyResult.rows.map((r) => ({ company: r.company, count: parseInt(r.count, 10) })),
      visaSponsorship: visaResult.rows.map((r) => ({ sponsored: r.visa_sponsorship, count: parseInt(r.count, 10) })),
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  list, getOne, create, update, remove, stats,
};
