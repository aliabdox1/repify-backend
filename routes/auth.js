const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');

// ─── Helper: generate token ───
const makeToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES });

// ─── POST /api/auth/register/user ───
router.post('/register/user', async (req, res) => {
  const { name, email, password, role, location } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });

  try {
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36);

    const result = await pool.query(
      `INSERT INTO users (name,email,password,slug,role,location)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,name,email,slug,role,plan`,
      [name, email, hash, slug, role||'', location||'']
    );
    const user = result.rows[0];
    res.status(201).json({ token: makeToken({ id: user.id, type: 'user' }), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/auth/register/company ───
router.post('/register/company', async (req, res) => {
  const { name, email, password, industry, location } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });

  try {
    const exists = await pool.query('SELECT id FROM companies WHERE email=$1', [email]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36);

    const result = await pool.query(
      `INSERT INTO companies (name,email,password,slug,industry,location)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,name,email,slug,industry,plan`,
      [name, email, hash, slug, industry||'', location||'']
    );
    const company = result.rows[0];
    res.status(201).json({ token: makeToken({ id: company.id, type: 'company' }), company });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/auth/login ───
router.post('/login', async (req, res) => {
  const { email, password, type } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const table  = type === 'company' ? 'companies' : 'users';
    const result = await pool.query(`SELECT * FROM ${table} WHERE email=$1`, [email]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const entity = result.rows[0];
    const match  = await bcrypt.compare(password, entity.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    delete entity.password;
    res.json({ token: makeToken({ id: entity.id, type: type||'user' }), user: entity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/auth/me ───
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const table  = req.user.type === 'company' ? 'companies' : 'users';
    const result = await pool.query(`SELECT * FROM ${table} WHERE id=$1`, [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    const entity = result.rows[0];
    delete entity.password;
    res.json(entity);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
