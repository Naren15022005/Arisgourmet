const http = require('http');

function post(path, body, cb) {
  const data = JSON.stringify(body);
  const opts = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
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

post('/auth/register', { email: 'dev@local', nombre: 'Dev', password: 'secret' }, (err, code, body) => {
  if (err) return console.error('register err', err);
  console.log('register', code, body);
  post('/auth/login', { email: 'dev@local', password: 'secret' }, (err2, code2, body2) => {
    if (err2) return console.error('login err', err2);
    console.log('login', code2, body2);
  });
});
