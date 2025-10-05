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
  password: '123',
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

// Admin-only registration endpoint
// Update the /api/admin/register endpoint
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

    const { 
      role, 
      username, 
      password, 
      first_name, 
      last_name, 
      nic, 
      gender, 
      date_of_birth, 
      branch_id,
      // Contact fields
      contact_no_1,
      contact_no_2,
      address,
      email
    } = req.body;

    // Validation - check required fields
    if (!username || !password || !first_name || !last_name || !nic || !gender || !date_of_birth || !branch_id) {
      return res.status(400).json({ message: 'All basic fields are required' });
    }

    // Contact validation
    if (!contact_no_1 || !address || !email) {
      return res.status(400).json({ message: 'All contact fields are required' });
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

      // Generate contact ID
      const contactCountQuery = 'SELECT COUNT(*) as count FROM contact';
      const contactCountResult = await client.query(contactCountQuery);
      const contactCount = parseInt(contactCountResult.rows[0].count);
      const contact_id = `CT${String(contactCount + 1).padStart(3, '0')}`;

      // Create contact record
      const insertContactQuery = `
        INSERT INTO contact (contact_id, type, contact_no_1, contact_no_2, address, email)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      await client.query(insertContactQuery, [
        contact_id, 
        'employee', 
        contact_no_1, 
        contact_no_2 || null, 
        address, 
        email
      ]);

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new employee
      const insertEmployeeQuery = `
        INSERT INTO employee (employee_id, role, username, password, first_name, last_name, nic, gender, date_of_birth, branch_id, contact_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING employee_id
      `;
      
      const insertResult = await client.query(insertEmployeeQuery, [
        employee_id, role, username, hashedPassword, first_name, last_name, 
        nic, gender, date_of_birth, branch_id, contact_id
      ]);

      await client.query('COMMIT');
      
      res.status(201).json({ 
        message: 'User created successfully',
        employee_id: insertResult.rows[0].employee_id,
        contact_id: contact_id
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Database error:', error);
      res.status(500).json({ message: 'Database error: ' + error.message });
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

// Branch Management APIs

// GET /api/admin/branches - Get all branches with contact info
app.get('/api/admin/branches', async (req, res) => {
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
      const result = await client.query(`
        SELECT 
          b.branch_id,
          b.name,
          b.created_at,
          c.contact_id,
          c.contact_no_1,
          c.contact_no_2,
          c.address,
          c.email
        FROM branch b
        JOIN contact c ON b.contact_id = c.contact_id
        ORDER BY b.created_at DESC
      `);
      
      res.json({ branches: result.rows });
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

// POST /api/admin/branches - Create new branch
app.post('/api/admin/branches', async (req, res) => {
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

    const { branch_id, name, contact_no_1, contact_no_2, address, email } = req.body;

    // Validation
    if (!branch_id || !name || !contact_no_1 || !address || !email) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if branch already exists
      const branchCheck = await client.query('SELECT * FROM branch WHERE branch_id = $1', [branch_id]);
      if (branchCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Branch ID already exists' });
      }

      // Generate contact ID
      const contactCount = await client.query('SELECT COUNT(*) as count FROM contact');
      const contactId = `CT${String(parseInt(contactCount.rows[0].count) + 1).padStart(3, '0')}`;

      // Create contact record
      await client.query(
        `INSERT INTO contact (contact_id, type, contact_no_1, contact_no_2, address, email)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [contactId, 'branch', contact_no_1, contact_no_2 || null, address, email]
      );

      // Create branch record
      await client.query(
        `INSERT INTO branch (branch_id, name, contact_id)
         VALUES ($1, $2, $3)`,
        [branch_id, name, contactId]
      );

      await client.query('COMMIT');
      
      res.status(201).json({ 
        message: 'Branch created successfully',
        branch_id: branch_id
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

// DELETE /api/admin/branches/:id - Delete branch
app.delete('/api/admin/branches/:id', async (req, res) => {
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
      await client.query('BEGIN');

      // Get contact_id for the branch
      const branchResult = await client.query('SELECT contact_id FROM branch WHERE branch_id = $1', [id]);
      if (branchResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Branch not found' });
      }

      const contactId = branchResult.rows[0].contact_id;

      // Check if branch has employees
      const employeesCheck = await client.query('SELECT COUNT(*) as count FROM employee WHERE branch_id = $1', [id]);
      if (parseInt(employeesCheck.rows[0].count) > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Cannot delete branch with assigned employees. Reassign employees first.' });
      }

      // Check if branch has accounts
      const accountsCheck = await client.query('SELECT COUNT(*) as count FROM account WHERE branch_id = $1', [id]);
      if (parseInt(accountsCheck.rows[0].count) > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Cannot delete branch with associated accounts. Transfer accounts first.' });
      }

      // Delete branch
      await client.query('DELETE FROM branch WHERE branch_id = $1', [id]);
      
      // Delete contact
      await client.query('DELETE FROM contact WHERE contact_id = $1', [contactId]);

      await client.query('COMMIT');
      
      res.json({ message: 'Branch deleted successfully' });
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

// Customer Registration API - Agent only
app.post('/api/agent/customers/register', async (req, res) => {
  // Verify agent authorization
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    if (decoded.role !== 'Agent' && decoded.role !== 'Admin') {
      return res.status(403).json({ message: 'Agent access required' });
    }

    const { first_name, last_name, nic, gender, date_of_birth, contact_no_1, contact_no_2, address, email } = req.body;

    // Validation
    if (!first_name || !last_name || !nic || !gender || !date_of_birth || !contact_no_1 || !address || !email) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Age validation
    const dob = new Date(date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    if (age < 18) {
      return res.status(400).json({ message: 'Customer must be at least 18 years old' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if customer with NIC already exists
      const customerCheck = await client.query('SELECT * FROM customer WHERE nic = $1', [nic]);
      if (customerCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Customer with this NIC already exists' });
      }

      // Generate customer ID
      const customerCount = await client.query('SELECT COUNT(*) as count FROM customer');
      const customerId = `CUST${String(parseInt(customerCount.rows[0].count) + 1).padStart(3, '0')}`;

      // Generate contact ID
      const contactCount = await client.query('SELECT COUNT(*) as count FROM contact');
      const contactId = `CT${String(parseInt(contactCount.rows[0].count) + 1).padStart(3, '0')}`;

      // Create contact record
      await client.query(
        `INSERT INTO contact (contact_id, type, contact_no_1, contact_no_2, address, email)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [contactId, 'customer', contact_no_1, contact_no_2 || null, address, email]
      );

      // Create customer record
      await client.query(
        `INSERT INTO customer (customer_id, first_name, last_name, gender, nic, date_of_birth, contact_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [customerId, first_name, last_name, gender, nic, date_of_birth, contactId]
      );

      await client.query('COMMIT');
      
      res.status(201).json({ 
        message: 'Customer registered successfully',
        customer_id: customerId
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

// Get all customers for account creation
app.get('/api/agent/customers', async (req, res) => {
  // Verify agent authorization
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    if (decoded.role !== 'Agent' && decoded.role !== 'Admin') {
      return res.status(403).json({ message: 'Agent access required' });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT customer_id, first_name, last_name, nic 
        FROM customer 
        ORDER BY first_name, last_name
      `);
      
      res.json({ customers: result.rows });
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

// Get all saving plans
app.get('/api/saving-plans', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT saving_plan_id, plan_type, interest, min_balance 
      FROM savingplan 
      ORDER BY plan_type
    `);
    
    res.json({ saving_plans: result.rows });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Database error' });
  } finally {
    client.release();
  }
});

// Get all branches
app.get('/api/branches', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT branch_id, name 
      FROM branch 
      ORDER BY name
    `);
    
    res.json({ branches: result.rows });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Database error' });
  } finally {
    client.release();
  }
});

// Create account for customer
app.post('/api/agent/accounts/create', async (req, res) => {
  // Verify agent authorization
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    if (decoded.role !== 'Agent' && decoded.role !== 'Admin') {
      return res.status(403).json({ message: 'Agent access required' });
    }

    const { customer_id, saving_plan_id, initial_deposit, branch_id } = req.body;

    // Validation
    if (!customer_id || !saving_plan_id || !branch_id || initial_deposit === undefined) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    if (initial_deposit < 0) {
      return res.status(400).json({ message: 'Initial deposit cannot be negative' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get saving plan details for validation
      const planResult = await client.query('SELECT * FROM savingplan WHERE saving_plan_id = $1', [saving_plan_id]);
      if (planResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Invalid saving plan' });
      }

      const savingPlan = planResult.rows[0];
      if (initial_deposit < savingPlan.min_balance) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          message: `Minimum deposit for ${savingPlan.plan_type} plan is LKR ${savingPlan.min_balance}` 
        });
      }

      // Verify customer exists
      const customerResult = await client.query('SELECT * FROM customer WHERE customer_id = $1', [customer_id]);
      if (customerResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Customer not found' });
      }

      // Verify branch exists
      const branchResult = await client.query('SELECT * FROM branch WHERE branch_id = $1', [branch_id]);
      if (branchResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Branch not found' });
      }

      // Generate account ID
      const accountCount = await client.query('SELECT COUNT(*) as count FROM account');
      const accountId = `ACC${String(parseInt(accountCount.rows[0].count) + 1).padStart(3, '0')}`;

      // Create account record
      await client.query(
        `INSERT INTO account (account_id, open_date, account_status, balance, saving_plan_id, branch_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [accountId, new Date().toISOString().split('T')[0], 'Active', initial_deposit, saving_plan_id, branch_id]
      );

      // Create takes relationship
      const takesCount = await client.query('SELECT COUNT(*) as count FROM takes');
      const takesId = `T${String(parseInt(takesCount.rows[0].count) + 1).padStart(3, '0')}`;

      await client.query(
        `INSERT INTO takes (takes_id, customer_id, account_id)
         VALUES ($1, $2, $3)`,
        [takesId, customer_id, accountId]
      );

      // Create initial transaction if deposit > 0
      if (initial_deposit > 0) {
        const transactionCount = await client.query('SELECT COUNT(*) as count FROM transaction');
        const transactionId = `TXN${String(parseInt(transactionCount.rows[0].count) + 1).padStart(3, '0')}`;

        await client.query(
          `INSERT INTO transaction (transaction_id, transaction_type, amount, time, description, account_id, employee_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [transactionId, 'Deposit', initial_deposit, new Date(), 'Initial Deposit', accountId, decoded.id]
        );
      }

      await client.query('COMMIT');
      
      res.status(201).json({ 
        message: 'Account created successfully',
        account_id: accountId
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
// Get accounts for transaction processing
app.get('/api/agent/accounts', async (req, res) => {
  // Verify agent authorization
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    if (decoded.role !== 'Agent' && decoded.role !== 'Admin') {
      return res.status(403).json({ message: 'Agent access required' });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          a.account_id,
          a.balance,
          a.account_status,
          c.first_name || ' ' || c.last_name as customer_name
        FROM account a
        JOIN takes t ON a.account_id = t.account_id
        JOIN customer c ON t.customer_id = c.customer_id
        WHERE a.account_status = 'Active'
        ORDER BY a.account_id
      `);
      
      res.json({ accounts: result.rows });
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

// Process transaction (deposit/withdrawal)
app.post('/api/agent/transactions/process', async (req, res) => {
  // Verify agent authorization
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    if (decoded.role !== 'Agent' && decoded.role !== 'Admin') {
      return res.status(403).json({ message: 'Agent access required' });
    }

    const { account_id, transaction_type, amount, description } = req.body;

    // Validation
    if (!account_id || !transaction_type || amount === undefined || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if account exists and get current balance
      const accountResult = await client.query(
        'SELECT * FROM account WHERE account_id = $1 AND account_status = $2',
        [account_id, 'Active']
      );

      if (accountResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Account not found or inactive' });
      }

      const account = accountResult.rows[0];
      let newBalance = account.balance;

      // Process based on transaction type
      if (transaction_type === 'Deposit') {
        newBalance = parseFloat(account.balance) + parseFloat(amount);
      } else if (transaction_type === 'Withdrawal') {
        if (parseFloat(account.balance) < parseFloat(amount)) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: 'Insufficient balance' });
        }
        newBalance = parseFloat(account.balance) - parseFloat(amount);
      } else {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Invalid transaction type' });
      }

      // Update account balance
      await client.query(
        'UPDATE account SET balance = $1 WHERE account_id = $2',
        [newBalance, account_id]
      );

      // Generate transaction ID
      const transactionCount = await client.query('SELECT COUNT(*) as count FROM transaction');
      const transactionId = `TXN${String(parseInt(transactionCount.rows[0].count) + 1).padStart(3, '0')}`;

      // Create transaction record
      await client.query(
        `INSERT INTO transaction (transaction_id, transaction_type, amount, time, description, account_id, employee_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [transactionId, transaction_type, amount, new Date(), description, account_id, decoded.id]
      );

      await client.query('COMMIT');
      
      res.status(201).json({ 
        message: 'Transaction processed successfully',
        transaction_id: transactionId,
        new_balance: newBalance
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Database error:', error);
      res.status(500).json({ message: 'Database error: ' + error.message });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

// Get recent transactions
app.get('/api/agent/transactions/recent', async (req, res) => {
  // Verify agent authorization
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    if (decoded.role !== 'Agent' && decoded.role !== 'Admin') {
      return res.status(403).json({ message: 'Agent access required' });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          transaction_id,
          transaction_type,
          amount,
          time,
          description,
          account_id,
          employee_id
        FROM transaction 
        ORDER BY time DESC 
        LIMIT 50
      `);
      
      res.json({ transactions: result.rows });
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
// Get agent performance metrics
app.get('/api/agent/performance', async (req, res) => {
  // Verify agent authorization
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    if (decoded.role !== 'Agent' && decoded.role !== 'Admin') {
      return res.status(403).json({ message: 'Agent access required' });
    }

    const client = await pool.connect();
    try {
      const employeeId = decoded.id;
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Today's transactions count
      const todayTransactionsResult = await client.query(
        `SELECT COUNT(*) as count FROM transaction 
         WHERE employee_id = $1 AND DATE(time) = $2`,
        [employeeId, today]
      );

      // Total customers registered by this agent
      const totalCustomersResult = await client.query(
        `SELECT COUNT(DISTINCT t.customer_id) as count 
         FROM takes t
         JOIN account a ON t.account_id = a.account_id
         JOIN transaction tr ON a.account_id = tr.account_id
         WHERE tr.employee_id = $1 AND tr.transaction_type = 'Deposit'`,
        [employeeId]
      );

      // Monthly accounts created
      const monthlyAccountsResult = await client.query(
        `SELECT COUNT(DISTINCT a.account_id) as count 
         FROM account a
         JOIN transaction tr ON a.account_id = tr.account_id
         WHERE tr.employee_id = $1 AND EXTRACT(MONTH FROM tr.time) = $2 
         AND EXTRACT(YEAR FROM tr.time) = $3`,
        [employeeId, currentMonth, currentYear]
      );

      // Total transaction volume
      const transactionVolumeResult = await client.query(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM transaction 
         WHERE employee_id = $1`,
        [employeeId]
      );

      // Recent activity
      const recentActivityResult = await client.query(
        `SELECT 
          'transaction' as type,
          transaction_type || ' - ' || description as description,
          time
         FROM transaction 
         WHERE employee_id = $1 
         UNION ALL
         SELECT 
          'account' as type,
          'Account created for ' || c.first_name || ' ' || c.last_name as description,
          a.open_date as time
         FROM account a
         JOIN takes t ON a.account_id = t.account_id
         JOIN customer c ON t.customer_id = c.customer_id
         JOIN transaction tr ON a.account_id = tr.account_id
         WHERE tr.employee_id = $1 AND tr.transaction_type = 'Deposit'
         ORDER BY time DESC 
         LIMIT 10`,
        [employeeId]
      );

      const performanceData = {
        today_transactions: parseInt(todayTransactionsResult.rows[0].count),
        total_customers: parseInt(totalCustomersResult.rows[0].count),
        monthly_accounts: parseInt(monthlyAccountsResult.rows[0].count),
        transaction_volume: parseFloat(transactionVolumeResult.rows[0].total),
        recent_activity: recentActivityResult.rows
      };

      res.json(performanceData);
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

// Get manager's team agents and their performance
app.get('/api/manager/team/agents', async (req, res) => {
  // Verify manager authorization
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    if (decoded.role !== 'Manager' && decoded.role !== 'Admin') {
      return res.status(403).json({ message: 'Manager access required' });
    }

    const client = await pool.connect();
    try {
      // Get manager's branch
      const managerResult = await client.query(
        'SELECT branch_id FROM employee WHERE employee_id = $1',
        [decoded.id]
      );

      if (managerResult.rows.length === 0) {
        return res.status(404).json({ message: 'Manager not found' });
      }

      const branchId = managerResult.rows[0].branch_id;

      // Get agents in the same branch
      const agentsResult = await client.query(`
        SELECT 
          e.employee_id, e.username, e.first_name, e.last_name, e.role,
          e.nic, e.gender, e.date_of_birth, e.branch_id, e.contact_id, e.created_at,
          c.contact_no_1, c.contact_no_2, c.email, c.address
        FROM employee e
        LEFT JOIN contact c ON e.contact_id = c.contact_id
        WHERE e.branch_id = $1 AND e.role = 'Agent'
        ORDER BY e.first_name, e.last_name
      `, [branchId]);

      // Get performance data for each agent
      const performanceData = {};
      for (const agent of agentsResult.rows) {
        const performanceResult = await client.query(`
          SELECT 
            COUNT(*) as total_transactions,
            COALESCE(SUM(amount), 0) as total_volume,
            COUNT(DISTINCT t.customer_id) as customers_registered,
            COUNT(DISTINCT a.account_id) as accounts_created,
            MAX(tr.time) as last_activity
          FROM transaction tr
          LEFT JOIN account a ON tr.account_id = a.account_id
          LEFT JOIN takes t ON a.account_id = t.account_id
          WHERE tr.employee_id = $1
        `, [agent.employee_id]);

        performanceData[agent.employee_id] = {
          total_transactions: parseInt(performanceResult.rows[0].total_transactions),
          total_volume: parseFloat(performanceResult.rows[0].total_volume),
          customers_registered: parseInt(performanceResult.rows[0].customers_registered),
          accounts_created: parseInt(performanceResult.rows[0].accounts_created),
          last_activity: performanceResult.rows[0].last_activity
        };
      }

      res.json({
        agents: agentsResult.rows,
        performance: performanceData
      });
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

// Get specific agent's transactions
app.get('/api/manager/team/agents/:agentId/transactions', async (req, res) => {
  // Verify manager authorization
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    if (decoded.role !== 'Manager' && decoded.role !== 'Admin') {
      return res.status(403).json({ message: 'Manager access required' });
    }

    const { agentId } = req.params;
    const client = await pool.connect();
    try {
      const transactionsResult = await client.query(`
        SELECT 
          transaction_id, transaction_type, amount, time, description, account_id, employee_id
        FROM transaction 
        WHERE employee_id = $1
        ORDER BY time DESC
        LIMIT 50
      `, [agentId]);

      res.json({
        transactions: transactionsResult.rows
      });
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

// Get branch transactions with filters
app.get('/api/manager/transactions', async (req, res) => {
  // Verify manager authorization
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    if (decoded.role !== 'Manager' && decoded.role !== 'Admin') {
      return res.status(403).json({ message: 'Manager access required' });
    }

    const { start, end } = req.query;
    const client = await pool.connect();
    try {
      // Get manager's branch
      const managerResult = await client.query(
        'SELECT branch_id FROM employee WHERE employee_id = $1',
        [decoded.id]
      );

      if (managerResult.rows.length === 0) {
        return res.status(404).json({ message: 'Manager not found' });
      }

      const branchId = managerResult.rows[0].branch_id;

      // Get transactions for the branch with agent names
      const transactionsResult = await client.query(`
        SELECT 
          t.transaction_id, t.transaction_type, t.amount, t.time, t.description,
          t.account_id, t.employee_id,
          e.first_name || ' ' || e.last_name as employee_name
        FROM transaction t
        JOIN employee e ON t.employee_id = e.employee_id
        JOIN account a ON t.account_id = a.account_id
        WHERE a.branch_id = $1 
        AND DATE(t.time) BETWEEN $2 AND $3
        ORDER BY t.time DESC
        LIMIT 100
      `, [branchId, start, end]);

      // Get summary data
      const summaryResult = await client.query(`
        SELECT 
          COUNT(*) as transaction_count,
          COALESCE(SUM(CASE WHEN transaction_type = 'Deposit' THEN amount ELSE 0 END), 0) as total_deposits,
          COALESCE(SUM(CASE WHEN transaction_type = 'Withdrawal' THEN amount ELSE 0 END), 0) as total_withdrawals,
          COALESCE(SUM(CASE WHEN transaction_type = 'Deposit' THEN amount ELSE -amount END), 0) as net_flow
        FROM transaction t
        JOIN account a ON t.account_id = a.account_id
        WHERE a.branch_id = $1 AND DATE(t.time) BETWEEN $2 AND $3
      `, [branchId, start, end]);

      // Get agent summary
      const agentSummaryResult = await client.query(`
        SELECT 
          e.employee_id,
          e.first_name || ' ' || e.last_name as employee_name,
          COUNT(*) as transaction_count,
          COALESCE(SUM(t.amount), 0) as total_volume
        FROM transaction t
        JOIN employee e ON t.employee_id = e.employee_id
        JOIN account a ON t.account_id = a.account_id
        WHERE a.branch_id = $1 AND DATE(t.time) BETWEEN $2 AND $3
        GROUP BY e.employee_id, e.first_name, e.last_name
        ORDER BY total_volume DESC
      `, [branchId, start, end]);

      const summary = {
        total_deposits: parseFloat(summaryResult.rows[0].total_deposits),
        total_withdrawals: parseFloat(summaryResult.rows[0].total_withdrawals),
        net_flow: parseFloat(summaryResult.rows[0].net_flow),
        transaction_count: parseInt(summaryResult.rows[0].transaction_count),
        agent_summary: agentSummaryResult.rows.map(row => ({
          employee_id: row.employee_id,
          employee_name: row.employee_name,
          transaction_count: parseInt(row.transaction_count),
          total_volume: parseFloat(row.total_volume)
        }))
      };

      res.json({
        transactions: transactionsResult.rows,
        summary: summary
      });
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

// Get customer accounts for manager's branch
app.get('/api/manager/accounts', async (req, res) => {
  // Verify manager authorization
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    if (decoded.role !== 'Manager' && decoded.role !== 'Admin') {
      return res.status(403).json({ message: 'Manager access required' });
    }

    const client = await pool.connect();
    try {
      // Get manager's branch
      const managerResult = await client.query(
        'SELECT branch_id FROM employee WHERE employee_id = $1',
        [decoded.id]
      );

      if (managerResult.rows.length === 0) {
        return res.status(404).json({ message: 'Manager not found' });
      }

      const branchId = managerResult.rows[0].branch_id;

      // Get accounts with customer and saving plan details
      const accountsResult = await client.query(`
        SELECT 
          a.account_id,
          a.open_date,
          a.account_status,
          a.balance,
          a.branch_id,
          a.saving_plan_id,
          c.customer_id,
          c.first_name,
          c.last_name,
          c.nic,
          c.gender,
          c.date_of_birth,
          ct.contact_no_1,
          ct.email,
          ct.address,
          sp.plan_type,
          sp.interest,
          sp.min_balance
        FROM account a
        JOIN takes t ON a.account_id = t.account_id
        JOIN customer c ON t.customer_id = c.customer_id
        JOIN contact ct ON c.contact_id = ct.contact_id
        LEFT JOIN savingplan sp ON a.saving_plan_id = sp.saving_plan_id
        WHERE a.branch_id = $1
        ORDER BY a.balance DESC
      `, [branchId]);

      // Calculate summary statistics
      const activeAccounts = accountsResult.rows.filter(acc => acc.account_status === 'Active');
      const totalBalance = activeAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
      
      const summary = {
        total_accounts: accountsResult.rows.length,
        active_accounts: activeAccounts.length,
        inactive_accounts: accountsResult.rows.length - activeAccounts.length,
        total_balance: totalBalance,
        average_balance: activeAccounts.length > 0 ? totalBalance / activeAccounts.length : 0
      };

      res.json({
        accounts: accountsResult.rows,
        summary: summary
      });
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