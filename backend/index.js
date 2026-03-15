require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// simple test route
app.get('/', (req, res) => {
  res.json({ message: 'Fuliza Agent Desk backend running' });
});

// Authentication route (placeholder)
app.post('/api/login', (req, res) => {
  // expect { shortcode, operatorId, pin }
  // validate credentials against your database or Daraja sandbox
  res.json({ success: true, token: 'fake-jwt-token' });
});

// Balance lookup (store/till balance & Fuliza limit)
app.get('/api/balance', (req, res) => {
  // retrieve from Daraja Account Balance API or local cache
  res.json({
    storeBalance: 12345.67,
    fulizaLimit: {
      available: 50000,
      used: 12000
    }
  });
});

// Withdrawal endpoint
app.post('/api/withdraw', (req, res) => {
  // expect { customerPhone, amount, agentPin, idNumber }
  console.log('Received /api/withdraw request:', req.body);
  // call Daraja B2C/B2B or Lipa na M-PESA
  const response = { success: true, transactionId: 'ABC123', received: req.body };
  res.json(response);
  console.log('Sent response:', response);
});

// Mini-statement / transaction history
app.get('/api/transactions', (req, res) => {
  // optionally accept query params like ?type=fuliza&limit=20
  res.json({
    transactions: [
      { id: '1', type: 'withdrawal', amount: 1000, date: '2026-03-10' }
    ]
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
