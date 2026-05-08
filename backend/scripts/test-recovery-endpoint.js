const api = require('axios').default;

(async () => {
  try {
    const token = '775b8362a3244d92670d2f897f3d1e5b0f6532b8fdfee77a5a410569d355d641';
    
    console.log('🧪 Testing recovery endpoint...');
    console.log(`Token: ${token}\n`);

    const res = await api.post('http://localhost:5000/api/auth/recovery/consume', { token });
    
    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(res.data, null, 2));
    
  } catch (err) {
    console.error('❌ Error:', err.response?.data?.message || err.message);
    console.error('Status:', err.response?.status);
    console.error('Full response:', err.response?.data);
  }
})();
