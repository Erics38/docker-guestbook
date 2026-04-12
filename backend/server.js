const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const port = 3000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost' }));
app.use(express.json());

const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many submissions, please try again later.' }
});

// Database connection (will be initialized after loading config)
let pool;
let appConfig = {};

async function loadConfig() {
  try {
    console.log('Loading configuration...');

    appConfig = {
      dbHost: process.env.DB_HOST || 'localhost',
      dbName: process.env.DB_NAME || 'guestbook',
      dbUser: process.env.DB_USER || 'postgres',
      dbPassword: process.env.DB_PASSWORD || (() => { throw new Error('DB_PASSWORD environment variable is required'); })(),
      dbPort: process.env.DB_PORT || '5432'
    };

    // Use SSL only for RDS/cloud environments
    const useSSL = appConfig.dbHost.includes('rds') || appConfig.dbHost.includes('amazonaws');

    pool = new Pool({
      host: appConfig.dbHost,
      database: appConfig.dbName,
      user: appConfig.dbUser,
      password: appConfig.dbPassword,
      port: parseInt(appConfig.dbPort),
      ssl: useSSL ? { rejectUnauthorized: true } : false
    });
    console.log(`Database connection initialized (SSL: ${useSSL})`);
    console.log('Configuration loaded successfully');
  } catch (error) {
    console.error('Failed to load configuration:', error);
    pool = null;
  }
}

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guestbook (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Database table initialized');
  } catch (err) {
    console.error('Database init error:', err);
    throw err;
  }
}

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'guestbook-backend',
    version: process.env.IMAGE_TAG || 'development'
  });
});

app.get('/ready', async (req, res) => {
  try {
    if (pool) {
      await pool.query('SELECT 1');
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        database: 'connected',
        service: 'guestbook-backend'
      });
    } else {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        database: 'demo-mode',
        service: 'guestbook-backend'
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not-ready',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

app.get('/live', (req, res) => {
  const uptime = process.uptime();
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime)}s`,
    memory: process.memoryUsage(),
    service: 'guestbook-backend'
  });
});

// In-memory demo data when no database is available
let demoMessages = [
  {
    id: 1,
    name: 'Welcome User',
    message: 'Welcome to the Guestbook!',
    created_at: new Date().toISOString()
  }
];

app.get('/api/guestbook', async (req, res) => {
  try {
    if (pool) {
      const result = await pool.query('SELECT * FROM guestbook ORDER BY created_at DESC');
      res.json(result.rows);
    } else {
      res.json(demoMessages);
    }
  } catch (err) {
    console.error('GET /api/guestbook error:', err);
    res.status(500).json({ error: 'An error occurred retrieving messages' });
  }
});

app.post('/api/guestbook', postLimiter, async (req, res) => {
  try {
    const { name, message } = req.body;

    if (!name || !message) {
      return res.status(400).json({ error: 'Name and message are required' });
    }
    if (typeof name !== 'string' || typeof message !== 'string') {
      return res.status(400).json({ error: 'Name and message must be strings' });
    }
    if (name.length > 100) {
      return res.status(400).json({ error: 'Name must be less than 100 characters' });
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message must be less than 1000 characters' });
    }

    const sanitizedName = name.trim().slice(0, 100);
    const sanitizedMessage = message.trim().slice(0, 1000);

    if (pool) {
      const result = await pool.query(
        'INSERT INTO guestbook (name, message) VALUES ($1, $2) RETURNING *',
        [sanitizedName, sanitizedMessage]
      );
      res.json(result.rows[0]);
    } else {
      const newMessage = {
        id: demoMessages.length + 1,
        name: sanitizedName,
        message: sanitizedMessage,
        created_at: new Date().toISOString()
      };
      demoMessages.unshift(newMessage);
      res.json(newMessage);
    }
  } catch (err) {
    console.error('POST /api/guestbook error:', err);
    res.status(500).json({ error: 'An error occurred saving your message' });
  }
});

async function startServer() {
  try {
    await loadConfig();
    await initDB();

    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
      console.log('Guestbook API ready');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
