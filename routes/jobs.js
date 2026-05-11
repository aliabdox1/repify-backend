const router = require('express').Router();
const pool   = require('../db');
const auth   = require('../middleware/auth');

// GET /api/jobs — list all active jobs
router.get('/', async (req, res) => {
  try {
    const { search, type, location } = req.query;
    let query = `
      SELECT j.*, c.name as company_name, c.logo_url, c.slug as company_slug
      FROM jobs j JOIN companies c ON j.company_id = c.id
      WHERE j.status = 'active'`;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (j.title ILIKE $${params.length} OR c.name ILIKE $${params.length})`;
    }
    if (type) {
      params.push(type);
      query += ` AND j.type = $${params.length}`;
    }
    query += ' ORDER BY j.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/jobs — company posts a job
router.post('/', auth, async (req, res) => {
  if (req.user.type !== 'company')
    return res.status(403).json({ error: 'Only companies can post jobs' });

  const { title, department, type, location, salary, description, skills, experience } = req.body;
  if (!title || !description)
    return res.status(400).json({ error: 'Title and description required' });

  try {
    const result = await pool.query(
      `INSERT INTO jobs (company_id,title,department,type,location,salary,description,skills,experience)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.id, title, department, type||'fulltime', location, salary, description,
       skills||[], experience]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/jobs/:id/apply — user applies
router.post('/:id/apply', auth, async (req, res) => {
  if (req.user.type !== 'user')
    return res.status(403).json({ error: 'Only users can apply' });

  try {
    await pool.query(
      `INSERT INTO applications (job_id,user_id) VALUES ($1,$2)`,
      [req.params.id, req.user.id]
    );
    await pool.query(
      `UPDATE jobs SET applicants = applicants + 1 WHERE id = $1`,
      [req.params.id]
    );
    res.json({ message: 'Application submitted successfully' });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already applied' });
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/jobs/company/mine — company's own jobs
router.get('/company/mine', auth, async (req, res) => {
  if (req.user.type !== 'company')
    return res.status(403).json({ error: 'Companies only' });
  try {
    const result = await pool.query(
      'SELECT * FROM jobs WHERE company_id=$1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
