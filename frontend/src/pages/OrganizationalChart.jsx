import React, { useEffect, useState } from 'react';
import { getOrganizationalChart } from '../services/organizationalChart';
import './OrganizationalChart.css';

const keyUnits = [
  {
    id: 'lrm',
    title: 'Learning Resource Management',
    summary: 'Curriculum resources, contextualized learning materials, and instructional support assets.'
  },
  {
    id: 'im',
    title: 'Instructional Management',
    summary: 'Program supervision, quality assurance, and curriculum implementation support.'
  },
  {
    id: 'dis',
    title: 'District Instructional Supervision',
    summary: 'District-level monitoring, technical assistance, and school-based instructional coaching.'
  },
  {
    id: 'als',
    title: 'Alternative Learning System',
    summary: 'Flexible learning pathways and inclusive education support for diverse learner needs.'
  }
];

export default function OrganizationalChart() {
  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChart = async () => {
      try {
        const data = await getOrganizationalChart();
        setChart(data);
      } catch (err) {
        console.error('Failed to load organizational chart:', err);
      } finally {
        setLoading(false);
      }
    };
    loadChart();
  }, []);

  if (loading) return <div className="org-chart-loading" style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;

  return (
    <main className="org-chart-page" role="main" aria-labelledby="org-chart-title">
      <section className="section-header" aria-labelledby="org-chart-title">
        <p className="section-eyebrow">Curriculum Implementation Division</p>
        <h1 id="org-chart-title" className="section-title">{chart?.title || 'CID Organizational Chart'}</h1>
        <p className="section-copy">
          {chart?.caption || 'Official organizational structure of the Curriculum Implementation Division (CID), showing reporting relationships, functional groups, and supervisory assignments.'}
        </p>
      </section>

      <section className="org-chart-hero" aria-labelledby="chart-image-title">
        <h2 id="chart-image-title" className="visually-hidden">CID organizational chart image</h2>
        <figure className="org-chart-figure">
          <img
            src={chart?.image_path || '/CID ORGANIZATIONAL CHART.png'}
            alt={chart?.title || 'Curriculum Implementation Division organizational chart'}
            className="org-chart-image"
          />
          <figcaption className="org-chart-caption">
            {chart?.caption || 'Curriculum Implementation Division reporting structure and personnel grouping.'}
          </figcaption>
        </figure>
      </section>

      <section className="org-chart-details" aria-labelledby="units-title">
        <header className="section-header section-header--compact">
          <h2 id="units-title" className="section-title">Core Functional Units</h2>
          <p className="section-copy">
            Primary groups represented in the CID chart and their key responsibilities.
          </p>
        </header>

        <div className="units-grid" role="list" aria-label="CID functional units">
          {keyUnits.map((unit) => (
            <article key={unit.id} className="unit-card" role="listitem">
              <h3 className="unit-title">{unit.title}</h3>
              <p className="unit-summary">{unit.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="chart-note" role="note">
        <p>
          For official updates, personnel changes, and role clarifications, refer to the latest
          Schools Division Office issuance.
        </p>
      </footer>
    </main>
  );
}


