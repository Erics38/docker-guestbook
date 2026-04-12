 const express = require('express');
  const { Pool } = require('pg');
  const cors = require('cors');
 const AWS = require('aws-sdk');

  const app = express();
  const port = 3000;

 // Configure AWS
 AWS.config.update({ region: 'us-east-1' });
 const sqs = new AWS.SQS();
 const ssm = new AWS.SSM();

 // Parameter Store helper function
 async function getParameter(name) {
   try {
     const result = await ssm.getParameter({
       Name: name,
       WithDecryption: true
     }).promise();
     return result.Parameter.Value;
   } catch (error) {
     console.error(`Failed to get parameter ${name}:`, error);
     throw error;
   }
 }

 // Load configuration from Parameter Store
 let appConfig = {};

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Database connection (will be initialized after loading config)
  let pool;

  // Simplified configuration for cloud deployment
  async function loadConfig() {
    try {
      console.log('Loading configuration...');
      
      // Use environment variables or defaults for cloud deployment
      appConfig = {
        dbHost: process.env.DB_HOST || 'localhost',
        dbName: process.env.DB_NAME || 'guestbook',
        dbUser: process.env.DB_USER || 'postgres',
        dbPassword: process.env.DB_PASSWORD || (() => { throw new Error('DB_PASSWORD environment variable is required'); })(),
        dbPort: process.env.DB_PORT || '5432',
        queueUrl: process.env.SQS_QUEUE_URL || null
      };
      
      // Initialize database connection
      // Use SSL only for production/cloud environments (contains 'rds' or 'amazonaws')
      const useSSL = appConfig.dbHost.includes('rds') || appConfig.dbHost.includes('amazonaws');

      pool = new Pool({
        host: appConfig.dbHost,
        database: appConfig.dbName,
        user: appConfig.dbUser,
        password: appConfig.dbPassword,
        port: parseInt(appConfig.dbPort),
        ssl: useSSL ? {
          rejectUnauthorized: true
        } : false
      });
      console.log(`Database connection initialized (SSL: ${useSSL})`);
      
      console.log('Configuration loaded successfully');
    } catch (error) {
      console.error('Failed to load configuration:', error);
      // Don't throw error - allow service to start in demo mode
      pool = null;
    }
  }

  // Initialize database table
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
      throw err; // Fail startup if database is not accessible
    }
  }

  // Health check endpoints (industry standard)
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'guestbook-backend',
      version: process.env.IMAGE_TAG || 'development'
    });
  });

  // Readiness check - can handle traffic?
  app.get('/ready', async (req, res) => {
    try {
      // Test database connection if available
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

  // Liveness check - is service alive?
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
      message: 'Welcome to the Guestbook! This is running in AWS ECS Fargate!',
      created_at: new Date().toISOString()
    }
  ];

  // Routes
  app.get('/api/guestbook', async (req, res) => {
    try {
      if (pool) {
        const result = await pool.query('SELECT * FROM guestbook ORDER BY created_at DESC');
        res.json(result.rows);
      } else {
        // Return demo data when no database is connected
        res.json(demoMessages);
      }
    } catch (err) {
      console.error('GET /api/guestbook error:', err);
      res.status(500).json({ error: 'An error occurred retrieving messages' });
    }
  });

  app.post('/api/guestbook', async (req, res) => {
    try {
      const { name, message } = req.body;
      
      // Input validation
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
      
      // Sanitize input
      const sanitizedName = name.trim().slice(0, 100);
      const sanitizedMessage = message.trim().slice(0, 1000);
      
      if (pool) {
        // Use database if available
        const result = await pool.query(
          'INSERT INTO guestbook (name, message) VALUES ($1, $2) RETURNING *',
          [sanitizedName, sanitizedMessage]
        );
        
        // Send notification to SQS if configured
        if (appConfig.queueUrl) {
          const sqsMessage = {
            QueueUrl: appConfig.queueUrl,
            MessageBody: JSON.stringify({
              id: result.rows[0].id,
              name: result.rows[0].name,
              message: result.rows[0].message,
              created_at: result.rows[0].created_at
            })
          };
          
          try {
            await sqs.sendMessage(sqsMessage).promise();
            console.log('Notification sent to SQS for entry:', result.rows[0].id);
          } catch (sqsError) {
            console.error('Failed to send SQS message:', sqsError);
          }
        }
        
        res.json(result.rows[0]);
      } else {
        // Use demo data when no database is connected
        const newMessage = {
          id: demoMessages.length + 1,
          name: sanitizedName,
          message: sanitizedMessage,
          created_at: new Date().toISOString()
        };
        
        demoMessages.unshift(newMessage); // Add to beginning of array
        res.json(newMessage);
      }
    } catch (err) {
      console.error('POST /api/guestbook error:', err);
      res.status(500).json({ error: 'An error occurred saving your message' });
    }
  });

  // Start server
  async function startServer() {
    try {
      await loadConfig();
      await initDB();
      
      app.listen(port, '0.0.0.0', () => {
        console.log(`Server running on port ${port}`);
        console.log('✅ Guestbook API ready with Parameter Store configuration');
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  startServer();