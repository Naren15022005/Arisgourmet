const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'ArisGourmet backend placeholder' });
});

// Simula activación de mesa por QR
app.post('/api/qr/activate', (req, res) => {
  const { tableId } = req.body || {};
  const now = new Date().toISOString();
  if (!tableId) return res.status(400).json({ error: 'tableId required' });
  // En el esqueleto sólo devolvemos el estado simulado
  return res.json({ tableId, status: 'activated', activatedAt: now });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Backend placeholder listening on ${port}`));
