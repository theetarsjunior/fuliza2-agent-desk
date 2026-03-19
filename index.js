require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// simple test route
app.get('/', (req, res) => {
  res.json({ message: 'Fuliza Agent Desk backend running' });
});

// Render health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
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

// PayHero / M-Pesa integration helper
const PAYHERO_API_KEY = process.env.PAYHERO_API_KEY;
const PAYHERO_API_SECRET = process.env.PAYHERO_API_SECRET;
const PAYHERO_AUTH_TOKEN = process.env.PAYHERO_AUTH_TOKEN;
const PAYHERO_CHANNEL_ID = process.env.PAYHERO_CHANNEL_ID;
const PAYHERO_CALLBACK_URL = process.env.PAYHERO_CALLBACK_URL;
const PAYHERO_BASE_URL =
  process.env.PAYHERO_BASE_URL || 'https://backend.payhero.co.ke/api/v2';

console.log('PayHero config check:', {
  hasKey: !!PAYHERO_API_KEY,
  hasSecret: !!PAYHERO_API_SECRET,
  hasAuthToken: !!PAYHERO_AUTH_TOKEN,
  hasChannelId: !!PAYHERO_CHANNEL_ID,
  baseUrl: PAYHERO_BASE_URL
});

async function sendPayheroStk({ phone, amount, reference }) {
  const authHeader = (() => {
    if (PAYHERO_AUTH_TOKEN) {
      let token = PAYHERO_AUTH_TOKEN.trim();
      // Common misconfigurations: users paste quotes, "Authorization: Basic ...", or duplicate "Basic".
      token = token.replace(/^['"]|['"]$/g, '');
      token = token.replace(/^authorization:\s*/i, '').trim();
      token = token.replace(/^basic\s+basic\s+/i, 'Basic ').trim();
      return token.toLowerCase().startsWith('basic ') ? token : `Basic ${token}`;
    }
    if (PAYHERO_API_KEY && PAYHERO_API_SECRET) {
      const encoded = Buffer.from(`${PAYHERO_API_KEY}:${PAYHERO_API_SECRET}`).toString(
        'base64'
      );
      return `Basic ${encoded}`;
    }
    return null;
  })();

  if (!authHeader) {
    throw new Error(
      'PayHero credentials are not configured. Set PAYHERO_AUTH_TOKEN or PAYHERO_API_KEY + PAYHERO_API_SECRET.'
    );
  }

  if (!PAYHERO_CHANNEL_ID) {
    throw new Error('PayHero channel is not configured. Set PAYHERO_CHANNEL_ID.');
  }

  console.log('PayHero auth header check:', {
    startsWithBasic: authHeader.toLowerCase().startsWith('basic '),
    length: authHeader.length
  });

  const payload = {
    amount,
    phone_number: phone,
    channel_id: Number(PAYHERO_CHANNEL_ID),
    external_reference: reference,
    callback_url: PAYHERO_CALLBACK_URL || undefined,
    provider: 'm-pesa'
  };

  const endpoint = `${PAYHERO_BASE_URL.replace(/\/+$/, '')}/payments`;
  console.log('Calling PayHero endpoint:', endpoint);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`PayHero error ${response.status}: ${errorBody}`);
  }

  return response.json();
}

// Withdrawal endpoint
app.post('/api/withdraw', async (req, res) => {
  // expect { customerPhone, amount, agentPin, idNumber }
  console.log('Received /api/withdraw request:', req.body);

  const { customerPhone, amount, idNumber } = req.body;
  const reference = `FULIZA-${Date.now()}`;

  try {
    // If PayHero is configured, make a real STK push
    if (PAYHERO_AUTH_TOKEN || (PAYHERO_API_KEY && PAYHERO_API_SECRET)) {
      const payheroResponse = await sendPayheroStk({ phone: customerPhone, amount, reference });
      res.json({ success: true, provider: 'payhero', reference, payheroResponse });
      console.log('Sent PayHero response:', payheroResponse);
      return;
    }

    // fallback: return fake response (for local/testing)
    const response = { success: true, transactionId: 'ABC123', received: req.body };
    res.json(response);
    console.log('Sent response:', response);
  } catch (err) {
    console.error('Withdraw error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
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
