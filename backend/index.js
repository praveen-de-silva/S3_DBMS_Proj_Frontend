const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'microbanking',
  password: 'praveen123',
  port: 5432,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to PostgreSQL database');
  release();
});

(async () => {
  try {
    const res = await pool.query('SELECT current_database(), current_schema()');
    console.log('Connected to DB:', res.rows);

    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log('Tables in public schema:', tables.rows);

    const users = await pool.query('SELECT * FROM employee LIMIT 5');
    console.log('Sample users:', users.rows);
  } catch (err) {
    console.error('DB check error:', err);
  }
})();


// Admin-only registration endpoint
app.post('/api/admin/register', async (req, res) => {
  // Verify admin authorization
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    if (decoded.role !== 'Admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { role, username, password, first_name, last_name, nic, gender, date_of_birth, branch_id, contact_id } = req.body;

    // Validation - check required fields
    if (!username || !password || !first_name || !last_name || !nic || !gender || !date_of_birth || !branch_id || !contact_id) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if username already exists
      const checkUserQuery = 'SELECT * FROM employee WHERE username = $1';
      const userResult = await client.query(checkUserQuery, [username]);
      
      if (userResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Generate employee ID based on role
      const countQuery = 'SELECT COUNT(*) as count FROM employee WHERE role = $1';
      const countResult = await client.query(countQuery, [role]);
      const count = parseInt(countResult.rows[0].count);
      const prefix = role.charAt(0).toUpperCase();
      const employee_id = `${prefix}${String(count + 1).padStart(3, '0')}`;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new employee
      const insertQuery = `
        INSERT INTO employee (employee_id, role, username, password, first_name, last_name, nic, gender, date_of_birth, branch_id, contact_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING employee_id
      `;
      
      const insertResult = await client.query(insertQuery, [
        employee_id, role, username, hashedPassword, first_name, last_name, 
        nic, gender, date_of_birth, branch_id, contact_id
      ]);

      await client.query('COMMIT');
      
      res.status(201).json({ 
        message: 'User created successfully',
        employee_id: insertResult.rows[0].employee_id
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Database error:', error);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

// Public registration endpoint (REMOVED or DISABLED)
// Comment out or remove this endpoint to prevent public registration
/*
app.post('/api/register', async (req, res) => {
  return res.status(403).json({ message: 'Public registration is disabled. Contact administrator for account creation.' });
});
*/

// Login endpoint - PostgreSQL version
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  console.log('Login attempt:', username);

  const client = await pool.connect();

  try {
    const query = 'SELECT * FROM employee WHERE username = $1';
    const result = await client.query(query, [username]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    
    // Compare password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: user.employee_id, role: user.role },
      'your_jwt_secret',
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user.employee_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Database error' });
  } finally {
    client.release();
  }
});

// Get all users (Admin only - for user management)
app.get('/api/admin/users', async (req, res) => {
  // Verify admin authorization
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    if (decoded.role !== 'Admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT employee_id, username, first_name, last_name, role, nic, gender, date_of_birth, branch_id, contact_id, created_at FROM employee ORDER BY created_at DESC'
      );
      
      res.json({ users: result.rows });
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

// DELETE /api/admin/users/:id - Already exists in your backend
app.delete('/api/admin/users/:id', async (req, res) => {
  // Verify admin authorization
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    if (decoded.role !== 'Admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      const result = await client.query('DELETE FROM employee WHERE employee_id = $1', [id]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ message: 'Database error' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

// Test endpoint to check if server is running
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({ 
      message: 'Server and database are running', 
      status: 'OK',
      database_time: result.rows[0].current_time
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Database connection failed', 
      status: 'ERROR' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});