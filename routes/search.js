const router = require('express').Router();
const pool   = require('../db');
const auth   = require('../middleware/auth');

// GET /api/search/candidates?q=&skill=&location=&verified=
router.get('/candidates', auth, async (req, res) => {
  if (req.user.type !== 'company')
    return res.status(403).json({ error: 'Companies only' });

  const { q, skill, location, verified } = req.query;
  let query = `
    SELECT u.id, u.name, u.slug, u.role, u.location, u.trust_score, u.avatar_url,
           COALESCE(AVG(r.rating), 0)::numeric(3,1) as avg_rating,
           COUNT(DISTINCT s.id) as skill_count,
           COUNT(DISTINCT a.id) as achievement_count,
           json_agg(DISTINCT jsonb_build_object('name',s.name,'verified',s.verified))
             FILTER (WHERE s.id IS NOT NULL) as skills
    FROM users u
    LEFT JOIN skills s ON s.user_id = u.id
    LEFT JOIN reviews r ON r.user_id = u.id
    LEFT JOIN achievements a ON a.user_id = u.id
    WHERE 1=1`;
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    query += ` AND (u.name ILIKE $${params.length} OR u.role ILIKE $${params.length})`;
  }
  if (location) {
    params.push(`%${location}%`);
    query += ` AND u.location ILIKE $${params.length}`;
  }
  if (skill) {
    params.push(`%${skill}%`);
    query += ` AND EXISTS (SELECT 1 FROM skills sk WHERE sk.user_id=u.id AND sk.name ILIKE $${params.length})`;
  }
  if (verified === 'true') {
    query += ` AND EXISTS (SELECT 1 FROM skills sk WHERE sk.user_id=u.id AND sk.verified=true)`;
  }

  query += ` GROUP BY u.id ORDER BY u.trust_score DESC LIMIT 50`;

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
