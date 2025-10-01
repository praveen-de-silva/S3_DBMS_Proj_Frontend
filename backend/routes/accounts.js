// POST /api/customers/:id/accounts
app.post('/api/customers/:id/accounts', async (req,res)=>{
  const { id } = req.params;
  const { type, balance, joint, jointMembers } = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO account (customer_id, type, balance, joint) VALUES ($1,$2,$3,$4) RETURNING account_id',
      [id, type, balance, joint]
    );
    const accountId = result.rows[0].account_id;
    if(joint && jointMembers?.length){
      for(const memberId of jointMembers){
        await client.query('INSERT INTO joint_account_member (account_id, customer_id) VALUES ($1,$2)', [accountId, memberId]);
      }
    }
    res.json({ account_id: accountId });
  } finally { client.release(); }
});
