const router = require('express').Router();
const pool   = require('../db');
const auth   = require('../middleware/auth');

// GET /api/users/:slug — public profile
router.get('/:slug', async (req, res) => {
  try {
    const u = await pool.query(
      `SELECT id,name,slug,role,location,bio,plan,trust_score,avatar_url,created_at
       FROM users WHERE slug=$1`, [req.params.slug]);
    if (!u.rows.length) return res.status(404).json({ error: 'User not found' });

    const user = u.rows[0];
    const [skills, achievements, reviews] = await Promise.all([
      pool.query('SELECT * FROM skills WHERE user_id=$1 ORDER BY verified DESC', [user.id]),
      pool.query('SELECT * FROM achievements WHERE user_id=$1 ORDER BY date DESC', [user.id]),
      pool.query('SELECT * FROM reviews WHERE user_id=$1 ORDER BY created_at DESC', [user.id]),
    ]);

    res.json({ ...user, skills: skills.rows, achievements: achievements.rows, reviews: reviews.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/me — update profile
router.put('/me', auth, async (req, res) => {
  const { name, role, location, bio } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET name=$1,role=$2,location=$3,bio=$4,updated_at=NOW()
       WHERE id=$5 RETURNING id,name,slug,role,location,bio,plan,trust_score`,
      [name, role, location, bio, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users/skills — add skill
router.post('/skills', auth, async (req, res) => {
  const { name, verified, polygon_tx, score } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO skills (user_id,name,verified,polygon_tx,score)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, name, verified||false, polygon_tx||null, score||null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users/achievements — add achievement
router.post('/achievements', auth, async (req, res) => {
  const { title, description, company, date, verified, polygon_tx } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO achievements (user_id,title,description,company,date,verified,polygon_tx)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, title, description, company, date, verified||false, polygon_tx||null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
