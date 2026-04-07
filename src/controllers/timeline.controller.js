const pool = require('../config/db');

const create = async (req, res, next) => {
  try {
    const { id: applicationId } = req.params;
    const userId = req.user.id;

    const app = await pool.query(
      'SELECT id FROM applications WHERE id = $1 AND user_id = $2',
      [applicationId, userId],
    );

    if (app.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const { event_type, description, event_date } = req.body;

    const result = await pool.query(
      `INSERT INTO timeline_events (application_id, event_type, description, event_date)
       VALUES ($1, $2, $3, COALESCE($4, NOW())) RETURNING *`,
      [applicationId, event_type, description, event_date],
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
};

module.exports = { create };
