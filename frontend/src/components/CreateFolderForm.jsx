import React, { useState, useEffect, useCallback } from 'react';
import { checkFolderName, getFolderTree } from '../services/adminIssuancesMgmt';
import { getCategories } from '../services/adminIssuancesMgmt'; // Assume this exists or I'll add it

const CreateFolderForm = ({ initialParentId, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: initialParentId || 'null',
    categories: [],
    visibility: 'private'
  });

  const [errors, setErrors] = useState({});
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allFolders, setAllFolders] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [showDescription, setShowDescription] = useState(false);

  // Load existing folders for hierarchy selector
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [folders, categories] = await Promise.all([
          getFolderTree(),
          getCategories()
        ]);
        setAllFolders(folders);
        setAvailableCategories(categories);
      } catch (err) {
        console.error('Failed to load form metadata', err);
      }
    };
    loadMetadata();
  }, []);

  // Debounced uniqueness check
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.name.trim()) {
        await validateName(formData.name);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [formData.name, formData.parent_id]);

  const validateName = async (name) => {
    const newErrors = { ...errors };
    const nameRegex = /^[a-zA-Z0-9\s-_]+$/;

    if (!nameRegex.test(name)) {
      newErrors.name = 'Only alphanumeric, spaces, hyphens, and underscores allowed.';
    } else if (name.length > 100) {
      newErrors.name = 'Maximum 100 characters allowed.';
    } else {
      setIsCheckingName(true);
      try {
        const { available } = await checkFolderName(name, formData.parent_id);
        if (!available) {
          newErrors.name = 'This folder name is already taken in this location.';
        } else {
          delete newErrors.name;
        }
      } catch (err) {
        console.error('Uniqueness check failed', err);
      } finally {
        setIsCheckingName(false);
      }
    }
    setErrors(newErrors);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (catId) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(catId)
        ? prev.categories.filter(id => id !== catId)
        : [...prev.categories, catId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (errors.name || !formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSuccess(formData);
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || 'Failed to create folder.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.name.trim() && !errors.name && !isCheckingName;

  return (
    <div className="premium-form-container">
      <form onSubmit={handleSubmit} className="premium-form">
        {/* Folder Name */}
        <div className="premium-form-group">
          <label htmlFor="folder-name" className="premium-label">
            Folder Name <span className="required">*</span>
          </label>
          <div className="input-wrapper">
            <input
              id="folder-name"
              name="name"
              type="text"
              className={`premium-input ${errors.name ? 'error' : ''}`}
              placeholder="e.g., 2026_Memoranda"
              value={formData.name}
              onChange={handleInputChange}
              maxLength={100}
              required
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {isCheckingName && <span className="input-spinner" />}
          </div>
          {errors.name && (
            <span id="name-error" className="premium-error-text" role="alert">
              {errors.name}
            </span>
          )}
        </div>

        {/* Parent Folder Selector */}
        <div className="premium-form-group">
          <label htmlFor="parent-id" className="premium-label">Parent Folder</label>
          <select
            id="parent-id"
            name="parent_id"
            className="premium-select"
            value={formData.parent_id}
            onChange={handleInputChange}
            aria-label="Select parent folder"
          >
            <option value="null">Root</option>
            {allFolders.map(f => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Collapsible Description */}
        <div className="premium-collapsible">
          <button
            type="button"
            className="premium-collapsible-trigger"
            onClick={() => setShowDescription(!showDescription)}
            aria-expanded={showDescription}
          >
            {showDescription ? '−' : '+'} Add Description
          </button>
          {showDescription && (
            <div className="premium-form-group animate-fade-in">
              <textarea
                name="description"
                className="premium-textarea"
                placeholder="Briefly describe the contents of this folder..."
                value={formData.description}
                onChange={handleInputChange}
                maxLength={500}
                aria-label="Folder description"
              />
              <span className="char-count">{formData.description.length}/500</span>
            </div>
          )}
        </div>

        {/* Category Picker */}
        <div className="premium-form-group">
          <label className="premium-label">Categories</label>
          <div className="premium-checkbox-grid">
            {availableCategories.map(cat => (
              <label key={cat.id} className="premium-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.categories.includes(cat.id)}
                  onChange={() => handleCategoryToggle(cat.id)}
                />
                <span>{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Visibility Toggle */}
        <div className="premium-form-group">
          <label className="premium-label">Visibility</label>
          <div className="premium-radio-group" role="radiogroup" aria-label="Visibility">
            <label className="premium-radio-label">
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={formData.visibility === 'private'}
                onChange={handleInputChange}
              />
              <span>Private</span>
            </label>
            <label className="premium-radio-label">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={formData.visibility === 'public'}
                onChange={handleInputChange}
              />
              <span>Public</span>
            </label>
          </div>
        </div>

        {errors.submit && <div className="premium-error-alert" role="alert">{errors.submit}</div>}

        {/* Actions */}
        <div className="premium-modal-footer">
          <button
            type="button"
            className="admin-btn-ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="admin-btn-primary"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Folder'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateFolderForm;
