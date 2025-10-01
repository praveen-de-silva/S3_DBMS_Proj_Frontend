// POST /api/accounts/:id/deposit
app.post('/api/accounts/:id/deposit', async (req,res)=>{
  const { id } = req.params;
  const { amount } = req.body;
  await pool.query('UPDATE account SET balance = balance + $1 WHERE account_id=$2', [amount, id]);
  res.json({ message: 'Deposit successful' });
});

// POST /api/accounts/:id/withdraw
app.post('/api/accounts/:id/withdraw', async (req,res)=>{
  const { id } = req.params;
  const { amount } = req.body;
  const result = await pool.query('SELECT balance FROM account WHERE account_id=$1', [id]);
  if(result.rows[0].balance < amount) return res.status(400).json({ error: 'Insufficient balance' });
  await pool.query('UPDATE account SET balance = balance - $1 WHERE account_id=$2', [amount, id]);
  res.json({ message: 'Withdrawal successful' });
});
