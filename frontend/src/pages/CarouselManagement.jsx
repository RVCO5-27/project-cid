import { useEffect, useState } from 'react';
import { getAllCarouselSlides, createCarouselSlide, updateCarouselSlide, deleteCarouselSlide } from '../services/carousel';
import { uploadFile } from '../services/upload';
import CarouselForm from '../components/CarouselForm';
import { resolveFileUrl } from '../services/api';

export default function CarouselManagementPage() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllCarouselSlides();
      setSlides(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (slide) => {
    setEditing(slide);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this slide?')) return;
    try {
      await deleteCarouselSlide(id);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleSave = async (payload) => {
    try {
      if (editing && editing.id) {
        await updateCarouselSlide(editing.id, payload);
      } else {
        await createCarouselSlide(payload);
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed');
    }
  };

  const handleUpload = async (file) => {
    try {
      const response = await uploadFile(file);
      return response.filePath;
    } catch (err) {
      alert(err.response?.data?.message || 'File upload failed');
      return null;
    }
  };

  return (
    <div className="admin-console">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>SHS Announcement Management</h2>
        <div>
          <button className="btn btn-success" onClick={handleAdd}>Add Slide</button>
        </div>
      </div>

      {showForm && (
        <CarouselForm
          key={editing ? editing.id : 'new'}
          initial={editing || {}}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={handleSave}
          onUpload={handleUpload}
        />
      )}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Sort Order</th>
              <th>Image</th>
              <th>Title</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {slides.map((slide) => (
              <tr key={slide.id}>
                <td>{slide.sort_order}</td>
                <td>
                  <img src={resolveFileUrl(slide.image_path)} alt={slide.title} className="img-thumbnail" style={{ maxHeight: '100px' }} />
                </td>
                <td>{slide.title}</td>
                <td>{slide.description}</td>
                <td>
                  <button className="btn btn-sm btn-primary me-2" onClick={() => handleEdit(slide)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(slide.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
