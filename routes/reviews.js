const router = require('express').Router();
const pool   = require('../db');
const auth   = require('../middleware/auth');

// GET /api/reviews/:userId
router.get('/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM reviews WHERE user_id=$1 ORDER BY created_at DESC',
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/reviews — submit review (no auth needed, reviewer uses link)
router.post('/', async (req, res) => {
  const { user_id, reviewer_name, reviewer_role, rating,
          quality, commitment, communication, competence, comment } = req.body;

  if (!user_id || !reviewer_name || !rating)
    return res.status(400).json({ error: 'user_id, reviewer_name, rating required' });

  try {
    // Simulated blockchain tx
    const polygon_tx = '0x' + Math.random().toString(16).slice(2, 18) + Date.now().toString(16);

    const result = await pool.query(
      `INSERT INTO reviews
       (user_id,reviewer_name,reviewer_role,rating,quality,commitment,communication,competence,comment,verified,polygon_tx)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10) RETURNING *`,
      [user_id, reviewer_name, reviewer_role||'', rating,
       quality||'ممتاز', commitment||'ممتاز', communication||'ممتاز', competence||'ممتاز',
       comment||'', polygon_tx]
    );

    // Update trust score
    await pool.query(
      `UPDATE users SET trust_score = LEAST(100,
         (SELECT COALESCE(AVG(rating)*20,0) FROM reviews WHERE user_id=$1)::integer
       ) WHERE id=$1`,
      [user_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
