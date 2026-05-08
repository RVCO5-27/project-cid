const http = require('http');

const loginData = JSON.stringify({ username: 'admin_local', password: 'strongPassword123' });

function login() {
  return new Promise((resolve, reject) => {
    const opts = {
      method: 'POST',
      host: '127.0.0.1',
      port: 5000,
      path: '/api/auth/login',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    const req = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          resolve(json.token);
        } catch (e) {
          reject(new Error('Login parse error: ' + e.message + ' RAW:' + d));
        }
      });
    });
    req.on('error', e => reject(e));
    req.write(loginData);
    req.end();
  });
}

function getStudents(token) {
  return new Promise((resolve, reject) => {
    const opts = {
      method: 'GET',
      host: '127.0.0.1',
      port: 5000,
      path: '/api/students',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    };
    const req = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    });
    req.on('error', e => reject(e));
    req.end();
  });
}

(async ()=>{
  try {
    const token = await login();
    console.log('TOKEN:', token);
    const students = await getStudents(token);
    console.log('STUDENTS:', students);
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(2);
  }
})();
