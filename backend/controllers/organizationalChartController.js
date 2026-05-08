const db = require('../config/db');
const { logUpdate, logCreate, calculateDiff, getClientIp, getUserAgent } = require('../services/auditService');

const getOrganizationalChart = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM organizational_chart');
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const updateOrganizationalChart = async (req, res, next) => {
  try {
    const { title, image_path, caption } = req.body;
    const [result] = await db.execute('SELECT * FROM organizational_chart');
    
    if (result.length > 0) {
      const oldData = result[0];
      const newData = { title, image_path, caption };
      const diff = calculateDiff(oldData, newData);
      
      await db.execute(
        'UPDATE organizational_chart SET title = ?, image_path = ?, caption = ? WHERE id = ?',
        [title, image_path, caption, oldData.id]
      );
      
      // Log organizational chart update
      await logUpdate(
        req.user?.id || null,
        'organizational_chart',
        oldData,
        newData,
        oldData.id,
        'org_chart',
        diff,
        `Updated organizational chart: ${title || 'Organizational Chart'}`,
        getClientIp(req),
        getUserAgent(req)
      );
      
      res.json({ id: oldData.id, ...req.body });
    } else {
      const [insertResult] = await db.execute(
        'INSERT INTO organizational_chart (title, image_path, caption) VALUES (?, ?, ?)',
        [title, image_path, caption]
      );
      
      // Log organizational chart creation
      const chartData = { title, image_path, caption };
      await logCreate(
        req.user?.id || null,
        'organizational_chart',
        chartData,
        insertResult.insertId,
        'org_chart',
        `Created organizational chart: ${title || 'Organizational Chart'}`,
        getClientIp(req),
        getUserAgent(req)
      );
      
      res.status(201).json({ id: insertResult.insertId, ...req.body });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOrganizationalChart,
  updateOrganizationalChart,
};
