require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { ensureImmutable } = require('./services/auditService');
const { runMigrations } = require('./database/runMigrations');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

function getCorsAllowedOrigins() {
  const raw = process.env.FRONTEND_ORIGIN;
  if (raw) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  // Vite defaults to 5173; some setups use 5174. 
  // http://localhost is added for standard XAMPP/Apache frontend access.
  return ['http://localhost:5173', 'http://localhost:5174', 'http://localhost', 'http://127.0.0.1'];
}

app.use(
  cors({
    origin(origin, callback) {
      const allowed = getCorsAllowedOrigins();
      if (!origin) return callback(null, true);
      if (allowed.includes(origin)) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));
app.use(cookieParser());
// Note: File upload is handled by multer in specific routes, not globally
app.use(morgan('dev'));

// Serve uploaded files statically at /uploads (in production, secure this)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Apply DB migrations on startup (XAMPP MySQL)
runMigrations()
  .then(({ applied }) => {
    if (applied > 0) console.log(`[migrations] Applied ${applied} migration(s)`);
  })
  .catch((err) => {
    console.warn('[migrations] Failed to apply migrations (continuing):', err.code || err.message);
  });

// Initialize audit log immutability on startup
ensureImmutable().catch(err => {
  console.warn('[init] Failed to initialize audit immutability:', err.message);
});

// Health route
app.get('/api/ping', (req, res) => res.json({ status: 'ok' }));

// Mount API routes
app.use('/api', routes);

// Fallback route for uploads listing (kept for convenience)
app.get('/api/uploads', (req, res) => {
  const dir = path.join(__dirname, 'uploads');
  fs.readdir(dir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Cannot read uploads directory' });
    res.json(files || []);
  });
});

// Error handler
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
