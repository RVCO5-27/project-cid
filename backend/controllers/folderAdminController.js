const db = require('../config/db');

/**
 * Folder Controller - Hierarchical folder management
 */
class FolderController {
  /**
   * Get all folders in a tree structure (Optimized for lazy loading if needed)
   */
  async getFolderTree(req, res, next) {
    try {
      const { parent_id, status, q, owner_id } = req.query;
      
      let sql = `
        SELECT f.*, 
               a.username as owner_name 
        FROM folders f
        LEFT JOIN admins a ON f.owner_id = a.id
        WHERE 1=1
      `;
      const params = [];

      if (parent_id !== undefined) {
        sql += ` AND f.parent_id <=> ?`;
        params.push(parent_id === 'null' || parent_id === '' ? null : parent_id);
      }

      if (status) {
        sql += ` AND f.status = ?`;
        params.push(status);
      }

      if (owner_id) {
        sql += ` AND f.owner_id = ?`;
        params.push(owner_id);
      }

      if (q) {
        sql += ` AND (f.name LIKE ? OR f.description LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`);
      }

      sql += ` ORDER BY f.name ASC`;

      const [rows] = await db.execute(sql, params);

      // If no filters, build the tree (for small datasets)
      // If parent_id or search is provided, return flat list (lazy load or search results)
      if (parent_id === undefined && !q) {
        const buildTree = (parentId = null) => {
          return rows
            .filter(row => row.parent_id === parentId)
            .map(row => ({
              ...row,
              children: buildTree(row.id)
            }));
        };
        res.json(buildTree());
      } else {
        res.json(rows);
      }
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create a new folder
   */
  async createFolder(req, res, next) {
    try {
      const { name, description, parent_id, is_immutable, status, visibility, categories } = req.body;
      const owner_id = req.user ? req.user.id : null;
      
      // Enhanced validation
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Folder name is required and cannot be empty' });
      }

      // Regex validation: alphanumeric, spaces, hyphens, underscores
      const nameRegex = /^[a-zA-Z0-9\s-_]+$/;
      if (!nameRegex.test(name)) {
        return res.status(400).json({ error: 'Folder name can only contain alphanumeric characters, spaces, hyphens, and underscores' });
      }

      if (name.length > 100) {
        return res.status(400).json({ error: 'Folder name cannot exceed 100 characters' });
      }

      // Verify owner_id exists in admins table
      if (owner_id) {
        const [[admin]] = await db.execute('SELECT id FROM admins WHERE id = ?', [owner_id]);
        if (!admin) {
          return res.status(400).json({ 
            error: 'Associated administrator account not found. Please re-login to refresh your session.' 
          });
        }
      }

      // Check for duplicate name in same parent
      const [[existing]] = await db.execute(
        'SELECT id FROM folders WHERE name = ? AND parent_id <=> ?',
        [name, parent_id === undefined ? null : (parent_id === 'null' ? null : parent_id)]
      );
      if (existing) {
        return res.status(400).json({ error: 'A folder with this name already exists in this location' });
      }

      const [result] = await db.execute(
        'INSERT INTO folders (name, description, parent_id, owner_id, is_immutable, status, visibility, categories) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          name, 
          description || null, 
          parent_id === undefined ? null : (parent_id === 'null' ? null : parent_id), 
          owner_id, 
          is_immutable ? 1 : 0, 
          status || 'active',
          visibility || 'private',
          categories ? JSON.stringify(categories) : null
        ]
      );

      // Audit log
      try {
        await db.execute(
          'INSERT INTO school_audit_logs (user_id, action_type, record_id, old_value, new_value) VALUES (?, ?, ?, ?, ?)',
          [owner_id, 'CREATE_FOLDER', result.insertId, null, JSON.stringify({ name, description, parent_id, status, visibility, categories })]
        );
      } catch (logErr) {
        console.error('[FolderController] Failed to log create action:', logErr.message);
      }

      res.status(201).json({ 
        id: result.insertId, 
        name, 
        description, 
        parent_id, 
        owner_id, 
        status: status || 'active',
        visibility: visibility || 'private',
        categories: categories || [],
        created_at: new Date()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Check if a folder name is unique in a given parent
   */
  async checkFolderName(req, res, next) {
    try {
      const { name, parent_id } = req.query;
      if (!name) return res.json({ available: true });

      const [[existing]] = await db.execute(
        'SELECT id FROM folders WHERE name = ? AND parent_id <=> ?',
        [name, parent_id === undefined || parent_id === 'null' ? null : parent_id]
      );

      res.json({ available: !existing });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Rename or move a folder
   */
  async updateFolder(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, parent_id, status } = req.body;

      // Check if exists and if immutable
      const [[folder]] = await db.execute('SELECT * FROM folders WHERE id = ?', [id]);
      if (!folder) return res.status(404).json({ error: 'Folder not found' });
      
      if (folder.is_immutable && name && name !== folder.name) {
        return res.status(403).json({ error: 'Immutable folders cannot be renamed' });
      }

      // Check for name conflicts if renaming
      if (name && name !== folder.name) {
        const [[conflict]] = await db.execute(
          'SELECT id FROM folders WHERE name = ? AND parent_id <=> ? AND id != ?',
          [name, parent_id === undefined ? folder.parent_id : parent_id, id]
        );
        if (conflict) {
          return res.status(400).json({ error: 'A folder with this name already exists in this location' });
        }
      }

      await db.execute(
        `UPDATE folders SET 
          name = COALESCE(?, name), 
          description = COALESCE(?, description), 
          parent_id = ?, 
          status = COALESCE(?, status) 
        WHERE id = ?`,
        [name || null, description || null, parent_id === undefined ? folder.parent_id : parent_id, status || null, id]
      );

      // Audit log
      try {
        await db.execute(
          'INSERT INTO school_audit_logs (user_id, action_type, record_id, old_value, new_value) VALUES (?, ?, ?, ?, ?)',
          [req.user ? req.user.id : null, 'UPDATE_FOLDER', id, JSON.stringify(folder), JSON.stringify({ name, description, parent_id, status })]
        );
      } catch (logErr) {
        console.error('[FolderController] Failed to log update action:', logErr.message);
      }

      res.json({ message: 'Folder updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete a folder (with cascade protection)
   */
  async deleteFolder(req, res, next) {
    try {
      const { id } = req.params;

      // Check for children or issuances
      const [[children]] = await db.execute('SELECT COUNT(*) as count FROM folders WHERE parent_id = ?', [id]);
      const [[issuances]] = await db.execute('SELECT COUNT(*) as count FROM issuances WHERE folder_id = ?', [id]);

      if (children.count > 0 || issuances.count > 0) {
        return res.status(400).json({ error: 'Cannot delete non-empty folder. Please move or delete contents first.' });
      }

      await db.execute('DELETE FROM folders WHERE id = ?', [id]);

      // Audit log
      try {
        await db.execute(
          'INSERT INTO school_audit_logs (user_id, action_type, record_id) VALUES (?, ?, ?)',
          [req.user ? req.user.id : null, 'DELETE_FOLDER', id]
        );
      } catch (logErr) {
        console.error('[FolderController] Failed to log delete action:', logErr.message);
      }

      res.json({ message: 'Folder deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Bulk move folders
   */
  async bulkMoveFolders(req, res, next) {
    try {
      const { folder_ids, target_parent_id } = req.body;
      if (!Array.isArray(folder_ids) || folder_ids.length === 0) {
        return res.status(400).json({ error: 'No folder IDs provided' });
      }

      // Check if target is not one of the sources or their children (prevent circularity)
      // This is a simplified check - in a full implementation we'd trace the path
      if (folder_ids.includes(target_parent_id)) {
        return res.status(400).json({ error: 'Cannot move a folder into itself' });
      }

      const placeholders = folder_ids.map(() => '?').join(',');
      await db.execute(
        `UPDATE folders SET parent_id = ? WHERE id IN (${placeholders})`,
        [target_parent_id || null, ...folder_ids]
      );

      res.json({ message: 'Folders moved successfully' });

      // Audit log
      try {
        await db.execute(
          'INSERT INTO school_audit_logs (user_id, action_type, old_value, new_value) VALUES (?, ?, ?, ?)',
          [req.user ? req.user.id : null, 'BULK_MOVE_FOLDERS', JSON.stringify({ folder_ids }), JSON.stringify({ target_parent_id })]
        );
      } catch (logErr) {
        console.error('[FolderController] Failed to log bulk move action:', logErr.message);
      }
    } catch (err) {
      next(err);
    }
  }
  /**
   * Get categories for folder selection
   */
  async getCategories(req, res, next) {
    try {
      const [rows] = await db.execute('SELECT id, name FROM categories ORDER BY name ASC');
      res.json(rows);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FolderController();
