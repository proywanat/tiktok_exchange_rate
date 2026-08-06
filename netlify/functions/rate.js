// Netlify Function — proxy ไปยัง BOT API
// path: /.netlify/functions/rate?start_period=...&end_period=...&currency=USD&token=...

const https = require('https');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const { start_period, end_period, currency = 'USD', token } = event.queryStringParameters || {};

  if (!token) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing token' }) };
  }

  const query = new URLSearchParams({ start_period, end_period, currency });
  const botUrl = `https://gateway.api.bot.or.th/Stat-ExchangeRate/v2/DAILY_AVG_EXG_RATE/?${query}`;

  try {
    const data = await new Promise((resolve, reject) => {
      const req = https.request(botUrl, {
        method: 'GET',
        headers: { 'Authorization': token, 'accept': 'application/json' },
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body }));
      });
      req.on('error', reject);
      req.end();
    });

    return { statusCode: data.status, headers, body: data.body };
  } catch (err) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: err.message }) };
  }
};
