import React, { useState } from 'react';
import {
  Container, Box, Typography, Button, Stack, TextField,
  MenuItem, Alert, Paper, Grid, Card, CardContent,
  FormControlLabel, Switch
} from '@mui/material';
import { Close as CloseIcon, Check as CheckIcon } from '@mui/icons-material';
import { getAuthHeaders } from '../services/auth';

const AgentDashboard: React.FC = () => {
  const [step, setStep] = useState<'main' | 'newCustomer' | 'existingCustomer' | 'accountDetails' | 'createAccount'>('main');
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });
  
  // Customer registration / search
  const [form, setForm] = useState({
    first_name: '', last_name: '', nic: '', date_of_birth: '', gender: '', address: '', contact_number: '', email: ''
  });
  const [customerId, setCustomerId] = useState('');
  const [customerData, setCustomerData] = useState<any>(null);
  
  // Account management
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [addingAccount, setAddingAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ type: '', balance: '' });
  const [isJoint, setIsJoint] = useState(false);
  const [jointMembers, setJointMembers] = useState<any[]>([]);
  const [nicToAdd, setNicToAdd] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);

  const showAlert = (message: string, severity: 'success' | 'error' = 'success') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 3000);
  };

  const goBack = () => {
    if (selectedAccount) { setSelectedAccount(null); return; }
    if (addingAccount) { setAddingAccount(false); setIsJoint(false); setJointMembers([]); setNewAccount({ type: '', balance: '' }); return; }
    if (step === 'newCustomer' || step === 'existingCustomer') setStep('main');
    setCustomerData(null); setCustomerId('');
  };

  // Handle input change
  const handleInputChange = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  // Register new customer
  const handleRegisterCustomer = async () => {
    if (!form.first_name || !form.last_name || !form.nic) { showAlert('Please fill all required fields', 'error'); return; }
    try {
      const res = await fetch('http://localhost:5000/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(`Customer registered! ID: ${data.customer_id}`);
        setForm({ first_name: '', last_name: '', nic: '', date_of_birth: '', gender: '', address: '', contact_number: '', email: '' });
        setTimeout(() => setStep('main'), 1500);
      } else showAlert(data.error || 'Registration failed', 'error');
    } catch (err) { console.error(err); showAlert('Cannot connect to server', 'error'); }
  };

  // Search existing customer
  const handleSearchCustomer = async () => {
    if (!customerId) { showAlert('Enter Customer ID', 'error'); return; }
    try {
      const res = await fetch(`http://localhost:5000/api/customers/${customerId}`, getAuthHeaders());
      if (!res.ok) { showAlert('Customer not found', 'error'); setCustomerData(null); return; }
      const data = await res.json();
      setCustomerData(data);

      // Fetch accounts
      const accRes = await fetch(`http://localhost:5000/api/customers/${customerId}/accounts`, getAuthHeaders());
      if (accRes.ok) { const accData = await accRes.json(); setAccounts(accData); } else setAccounts([]);
      showAlert('Customer loaded successfully!');
    } catch (err) { console.error(err); showAlert('Cannot connect to server', 'error'); }
  };

  // Verify NIC for joint account
  const handleVerifyNIC = async () => {
    if (!nicToAdd) return;
    try {
      const res = await fetch(`http://localhost:5000/api/customers/by-nic/${nicToAdd}`, getAuthHeaders());
      if (res.ok) { const data = await res.json(); setVerifyResult({ exists: true, customer: data }); }
      else setVerifyResult({ exists: false });
    } catch { setVerifyResult({ exists: false }); }
  };

  const handleAddMember = () => {
    if (verifyResult?.exists && verifyResult.customer && !jointMembers.find(m => m.nic === verifyResult.customer.nic)) {
      setJointMembers(prev => [...prev, verifyResult.customer]); setNicToAdd(''); setVerifyResult(null);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>Agent Dashboard</Typography>
      {alert.show && <Alert severity={alert.severity} sx={{ mb: 2 }}>{alert.message}</Alert>}

      {/* Main Menu */}
      {step === 'main' && (
        <Stack spacing={2} sx={{ maxWidth: 400, mx: 'auto' }}>
          <Button variant="contained" onClick={() => setStep('newCustomer')}>➕ New Customer</Button>
          <Button variant="contained" onClick={() => setStep('existingCustomer')}>🔍 Existing Customer</Button>
        </Stack>
      )}

      {/* New Customer Form */}
      {step === 'newCustomer' && (
        <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h5" gutterBottom>Register New Customer</Typography>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="First Name *" fullWidth value={form.first_name} onChange={e => handleInputChange('first_name', e.target.value)} />
              <TextField label="Last Name *" fullWidth value={form.last_name} onChange={e => handleInputChange('last_name', e.target.value)} />
            </Stack>
            <TextField label="NIC *" value={form.nic} onChange={e => handleInputChange('nic', e.target.value)} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField type="date" label="DOB" InputLabelProps={{ shrink: true }} value={form.date_of_birth} onChange={e => handleInputChange('date_of_birth', e.target.value)} fullWidth />
              <TextField select label="Gender" value={form.gender} onChange={e => handleInputChange('gender', e.target.value)} fullWidth>
                <MenuItem value=""><em>Select</em></MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Stack>
            <TextField label="Address" multiline rows={2} value={form.address} onChange={e => handleInputChange('address', e.target.value)} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Contact Number" value={form.contact_number} onChange={e => handleInputChange('contact_number', e.target.value)} />
              <TextField type="email" label="Email" value={form.email} onChange={e => handleInputChange('email', e.target.value)} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={handleRegisterCustomer}>Register</Button>
              <Button variant="outlined" onClick={goBack}>Cancel</Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Existing Customer Search */}
      {step === 'existingCustomer' && !customerData && (
        <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h5" gutterBottom>Search Customer</Typography>
          <Stack spacing={2}>
            <TextField label="Customer ID" value={customerId} onChange={e => setCustomerId(e.target.value)} />
            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={handleSearchCustomer}>Search</Button>
              <Button variant="outlined" onClick={goBack}>Back</Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Customer Details & Accounts */}
      {customerData && !selectedAccount && !addingAccount && (
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6">Customer Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}><Typography><strong>ID:</strong> {customerData.customer_id}</Typography></Grid>
              <Grid item xs={6}><Typography><strong>NIC:</strong> {customerData.nic}</Typography></Grid>
              <Grid item xs={6}><Typography><strong>Name:</strong> {customerData.first_name} {customerData.last_name}</Typography></Grid>
              <Grid item xs={6}><Typography><strong>DOB:</strong> {customerData.date_of_birth}</Typography></Grid>
              <Grid item xs={6}><Typography><strong>Gender:</strong> {customerData.gender}</Typography></Grid>
              <Grid item xs={6}><Typography><strong>Contact:</strong> {customerData.contact_number}</Typography></Grid>
              <Grid item xs={12}><Typography><strong>Address:</strong> {customerData.address}</Typography></Grid>
            </Grid>
          </Paper>

          <Typography variant="h6" gutterBottom>Accounts</Typography>
          {accounts.length > 0 ? (
            <Grid container spacing={2}>
              {accounts.map(acc => (
                <Grid item xs={12} sm={6} key={acc.account_id}>
                  <Card sx={{ cursor: 'pointer' }} onClick={() => setSelectedAccount(acc)}>
                    <CardContent>
                      <Typography>Account #{acc.account_id}</Typography>
                      <Typography>Type: {acc.type}</Typography>
                      <Typography>Balance: Rs. {acc.balance}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : <Typography>No accounts</Typography>}

          <Button variant="contained" sx={{ mt: 2 }} onClick={() => setAddingAccount(true)}>➕ New Account</Button>
          <Button variant="outlined" sx={{ mt: 2, ml: 2 }} onClick={goBack}>Back</Button>
        </Box>
      )}

      {/* Create New Account */}
      {addingAccount && (
        <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h5">Create Account</Typography>
          <Stack spacing={2}>
            <TextField select label="Account Type" value={newAccount.type} onChange={e => setNewAccount(prev => ({ ...prev, type: e.target.value }))}>
              <MenuItem value="Savings">Savings</MenuItem>
              <MenuItem value="Checking">Checking</MenuItem>
            </TextField>
            <TextField label="Initial Balance" type="number" value={newAccount.balance} onChange={e => setNewAccount(prev => ({ ...prev, balance: e.target.value }))} />
            
            <FormControlLabel control={<Switch checked={isJoint} onChange={e => setIsJoint(e.target.checked)} />} label="Joint Account" />
            
            {isJoint && (
              <Box sx={{ border: '1px solid #ccc', p: 2, borderRadius: 2 }}>
                <Typography>Joint Members</Typography>
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <TextField label="NIC" value={nicToAdd} onChange={e => setNicToAdd(e.target.value)} />
                  <Button variant="contained" onClick={handleVerifyNIC}>Verify</Button>
                  {verifyResult && (verifyResult.exists ? <CheckIcon color="success" /> : <CloseIcon color="error" />)}
                </Stack>
                {verifyResult?.exists && <Button variant="outlined" onClick={handleAddMember}>Add Member</Button>}
                {jointMembers.map(m => <Paper key={m.nic} sx={{ p: 1, mb: 1 }}>{m.first_name} {m.last_name} ({m.nic})</Paper>)}
              </Box>
            )}

            <Stack direction="row" spacing={2}>
              <Button variant="contained">Save Account</Button>
              <Button variant="outlined" onClick={goBack}>Cancel</Button>
            </Stack>
          </Stack>
        </Paper>
      )}
    </Container>
  );
};

export default AgentDashboard;
