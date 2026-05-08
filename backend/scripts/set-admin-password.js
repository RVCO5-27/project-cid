// Usage: node scripts/set-admin-password.js <username> <newPassword>
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const COMMON_PASSWORDS = [
  '123456','password','123456789','12345678','12345','111111','1234567','qwerty','abc123','password1','letmein'
];

async function main(){
  const args = process.argv.slice(2);
  if(args.length<2){ console.log('Usage: node scripts/set-admin-password.js <username> <newPassword>'); process.exit(1); }
  const [username,newPassword]=args;

  if (!newPassword || newPassword.length < 8) {
    console.error('Password too short — must be at least 8 characters');
    process.exit(2);
  }
  if (COMMON_PASSWORDS.includes(newPassword.toLowerCase())) {
    console.error('Password is too common — choose a stronger password');
    process.exit(3);
  }

  try{
    const hash = await bcrypt.hash(newPassword,10);
    const [result]=await db.execute('UPDATE admins SET password = ? WHERE username = ?', [hash, username]);
    if(result.affectedRows===0){ console.log('No admin updated (username may not exist)'); process.exit(4); }
    console.log('Password updated for', username);
    process.exit(0);
  }catch(e){ console.error('ERR', e.message); process.exit(5); }
}

main();
