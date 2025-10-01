// POST /api/customers
app.post('/api/customers', async (req,res)=>{
  const { first_name, last_name, nic, date_of_birth, gender, address, contact_number, email } = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO customer (first_name, last_name, nic, date_of_birth, gender, address, contact_number, email) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING customer_id',
      [first_name, last_name, nic, date_of_birth, gender, address, contact_number, email]
    );
    res.json({ customer_id: result.rows[0].customer_id });
  } finally { client.release(); }
});

// GET /api/customers/:id
app.get('/api/customers/:id', async (req,res)=>{
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM customer WHERE customer_id=$1', [id]);
    if(result.rows.length===0) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
  } finally { client.release(); }
});

// GET /api/customers/:id/accounts
app.get('/api/customers/:id/accounts', async (req,res)=>{
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM account WHERE customer_id=$1', [id]);
    res.json(result.rows);
  } finally { client.release(); }
});
