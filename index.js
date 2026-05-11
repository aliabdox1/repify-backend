require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const pool    = require('./db');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/jobs',     require('./routes/jobs'));
app.use('/api/reviews',  require('./routes/reviews'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/search',   require('./routes/search'));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// Frontend fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
  ██████╗ ███████╗██████╗ ██╗███████╗██╗   ██╗
  ██╔══██╗██╔════╝██╔══██╗██║██╔════╝╚██╗ ██╔╝
  ██████╔╝█████╗  ██████╔╝██║█████╗   ╚████╔╝ 
  ██╔══██╗██╔══╝  ██╔═══╝ ██║██╔══╝    ╚██╔╝  
  ██║  ██║███████╗██║     ██║██║        ██║   
  ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚═╝        ╚═╝   
  
  ✓ Server running on http://localhost:${PORT}
  ✓ API ready at http://localhost:${PORT}/api
  `);
});
