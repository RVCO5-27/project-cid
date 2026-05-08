const db = require('../config/db');
const { logCreate, logUpdate, logDelete, calculateDiff, getClientIp, getUserAgent } = require('../services/auditService');

const getAllCarouselSlides = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM carousel_slides ORDER BY sort_order ASC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const createCarouselSlide = async (req, res, next) => {
  try {
    const { title, description, image_path, cta_text, cta_link, category, sort_order } = req.body;
    
    if (!image_path) {
      return res.status(400).json({ message: 'Image path is required' });
    }

    const [result] = await db.execute(
      'INSERT INTO carousel_slides (title, description, image_path, cta_text, cta_link, category, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title || '', description || '', image_path, cta_text || '', cta_link || '', category || '', sort_order || 0]
    );
    
    // Log carousel slide creation
    const slideData = { title, description, image_path, cta_text, cta_link, category, sort_order };
    await logCreate(
      req.user?.id || null,
      'carousel',
      slideData,
      result.insertId,
      'carousel_slide',
      `Created carousel slide: ${title || 'Untitled'}`,
      getClientIp(req),
      getUserAgent(req)
    );
    
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    next(err);
  }
};

const updateCarouselSlide = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, image_path, cta_text, cta_link, category, sort_order } = req.body;
    
    if (!image_path) {
      return res.status(400).json({ message: 'Image path is required' });
    }

    // Get old data for comparison
    const [[oldData]] = await db.execute('SELECT * FROM carousel_slides WHERE id = ?', [id]);
    
    if (!oldData) {
      return res.status(404).json({ message: 'Carousel slide not found' });
    }

    await db.execute(
      'UPDATE carousel_slides SET title = ?, description = ?, image_path = ?, cta_text = ?, cta_link = ?, category = ?, sort_order = ? WHERE id = ?',
      [title || '', description || '', image_path, cta_text || '', cta_link || '', category || '', sort_order || 0, id]
    );
    
    // Log carousel slide update
    const newData = { title, description, image_path, cta_text, cta_link, category, sort_order };
    const diff = calculateDiff(oldData, newData);
    await logUpdate(
      req.user?.id || null,
      'carousel',
      oldData,
      newData,
      id,
      'carousel_slide',
      diff,
      `Updated carousel slide: ${title || 'Untitled'}`,
      getClientIp(req),
      getUserAgent(req)
    );
    
    res.json({ id, ...req.body });
  } catch (err) {
    next(err);
  }
};

const deleteCarouselSlide = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get data before deletion for audit log
    const [[slideData]] = await db.execute('SELECT * FROM carousel_slides WHERE id = ?', [id]);
    if (!slideData) {
      return res.status(404).json({ message: 'Carousel slide not found' });
    }
    
    await db.execute('DELETE FROM carousel_slides WHERE id = ?', [id]);
    
    // Log carousel slide deletion
    await logDelete(
      req.user?.id || null,
      'carousel',
      slideData,
      id,
      'carousel_slide',
      `Deleted carousel slide: ${slideData.title || 'Untitled'}`,
      getClientIp(req),
      getUserAgent(req)
    );
    
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllCarouselSlides,
  createCarouselSlide,
  updateCarouselSlide,
  deleteCarouselSlide,
};
