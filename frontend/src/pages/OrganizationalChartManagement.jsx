import { useEffect, useState } from 'react';
import { getOrganizationalChart, updateOrganizationalChart } from '../services/organizationalChart';
import { uploadFile } from '../services/upload';
import OrganizationalChartForm from '../components/OrganizationalChartForm';

export default function OrganizationalChartManagementPage() {
  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getOrganizationalChart();
      setChart(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (payload) => {
    try {
      await updateOrganizationalChart(payload);
      await load();
      alert('Organizational chart updated successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed');
    }
  };

  const handleUpload = async (file) => {
    try {
      const response = await uploadFile(file);
      return response.filePath;
    } catch (err) {
      alert('File upload failed');
      return null;
    }
  };

  return (
    <div className="admin-console">
      <h2 className="mb-3">Organizational Chart Management</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <OrganizationalChartForm initial={chart || {}} onSave={handleSave} onUpload={handleUpload} />
      )}
    </div>
  );
}
