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

    const {
      name, role, email, linkedin_url, notes,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO contacts (application_id, name, role, email, linkedin_url, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [applicationId, name, role, email, linkedin_url, notes],
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await pool.query(
      `SELECT c.id FROM contacts c
       JOIN applications a ON c.application_id = a.id
       WHERE c.id = $1 AND a.user_id = $2`,
      [id, userId],
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const {
      name, role, email, linkedin_url, notes,
    } = req.body;

    const result = await pool.query(
      `UPDATE contacts SET
        name = COALESCE($1, name),
        role = COALESCE($2, role),
        email = COALESCE($3, email),
        linkedin_url = COALESCE($4, linkedin_url),
        notes = COALESCE($5, notes)
      WHERE id = $6 RETURNING *`,
      [name, role, email, linkedin_url, notes, id],
    );

    return res.json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `DELETE FROM contacts c
       USING applications a
       WHERE c.application_id = a.id AND c.id = $1 AND a.user_id = $2
       RETURNING c.id`,
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    return res.json({ message: 'Contact deleted' });
  } catch (err) {
    return next(err);
  }
};

module.exports = { create, update, remove };
