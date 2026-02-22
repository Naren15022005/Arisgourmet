const http = require('http');

function post(path, body, headers = {}, cb) {
  const data = JSON.stringify(body);
  const opts = {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }, headers),
  };
  const req = http.request('http://localhost:4000' + path, opts, (res) => {
    let b = '';
    res.on('data', (c) => (b += c));
    res.on('end', () => cb(null, res.statusCode, b));
  });
  req.on('error', (e) => cb(e));
  req.write(data);
  req.end();
}

post('/auth/login', { email: 'dev@local', password: 'secret' }, {}, (err, code, body) => {
  if (err) return console.error('login err', err);
  console.log('login', code, body);
  let token = null;
  try { token = JSON.parse(body).access_token; } catch(e) { return console.error('no token', e, body); }
  post('/api/mesas/activate', { codigo_qr: 'MESA-1' }, { Authorization: 'Bearer ' + token }, (err2, code2, body2) => {
    if (err2) return console.error('activate err', err2);
    console.log('activate', code2, body2);
  });
});
