const router = require('express').Router();
const pool   = require('../db');
const auth   = require('../middleware/auth');

// GET /api/messages — get my conversations
router.get('/', auth, async (req, res) => {
  try {
    const { id, type } = req.user;
    const result = await pool.query(`
      SELECT DISTINCT ON (
        LEAST(CONCAT(sender_type,sender_id), CONCAT(receiver_type,receiver_id)),
        GREATEST(CONCAT(sender_type,sender_id), CONCAT(receiver_type,receiver_id))
      )
        m.*,
        CASE WHEN m.sender_id=$1 AND m.sender_type=$2
          THEN m.receiver_id ELSE m.sender_id END as other_id,
        CASE WHEN m.sender_id=$1 AND m.sender_type=$2
          THEN m.receiver_type ELSE m.sender_type END as other_type
      FROM messages m
      WHERE (sender_id=$1 AND sender_type=$2) OR (receiver_id=$1 AND receiver_type=$2)
      ORDER BY
        LEAST(CONCAT(sender_type,sender_id), CONCAT(receiver_type,receiver_id)),
        GREATEST(CONCAT(sender_type,sender_id), CONCAT(receiver_type,receiver_id)),
        created_at DESC
    `, [id, type]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/messages/:otherId/:otherType — conversation thread
router.get('/:otherId/:otherType', auth, async (req, res) => {
  const { id, type } = req.user;
  const { otherId, otherType } = req.params;
  try {
    const result = await pool.query(`
      SELECT * FROM messages
      WHERE (sender_id=$1 AND sender_type=$2 AND receiver_id=$3 AND receiver_type=$4)
         OR (sender_id=$3 AND sender_type=$4 AND receiver_id=$1 AND receiver_type=$2)
      ORDER BY created_at ASC
    `, [id, type, otherId, otherType]);

    // Mark as read
    await pool.query(`
      UPDATE messages SET read=true
      WHERE receiver_id=$1 AND receiver_type=$2 AND sender_id=$3 AND sender_type=$4 AND read=false
    `, [id, type, otherId, otherType]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/messages — send message
router.post('/', auth, async (req, res) => {
  const { receiver_id, receiver_type, content } = req.body;
  if (!receiver_id || !content)
    return res.status(400).json({ error: 'receiver_id and content required' });

  try {
    const result = await pool.query(`
      INSERT INTO messages (sender_id,sender_type,receiver_id,receiver_type,content)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [req.user.id, req.user.type, receiver_id, receiver_type||'user', content]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
