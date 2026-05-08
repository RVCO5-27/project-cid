const db = require('../config/db');
(async ()=>{
  try{
    const [rows] = await db.execute('SELECT id, username, created_at FROM admins');
    console.log('ADMINS:', rows);
    process.exit(0);
  }catch(e){ console.error('ERR', e.message); process.exit(2);} 
})();
