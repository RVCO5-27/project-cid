import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStatsSummary } from '../services/stats';
import './About.css';

export default function About() {
  const [stats, setStats] = useState([
    { value: '...', label: 'Public Schools' },
    { value: '...', label: 'Private Schools' },
    { value: '...', label: 'Active Issuances' },
    { value: '...', label: 'Document Categories' },
  ]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getStatsSummary();
        setStats([
          { value: `${data.publicSchools}+`, label: 'Public Schools' },
          { value: `${data.privateSchools}+`, label: 'Private Schools' },
          { value: `${data.issuances}+`, label: 'Active Issuances' },
          { value: `${data.categories}+`, label: 'Document Categories' },
        ]);
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    };
    loadStats();
  }, []);

  const timeline = [
    { year: '2026', title: 'SHS Program Enhancement', description: 'Launch of the Strengthened SHS 2026-2027 program with new curriculum enhancements' },
    { year: '2025', title: 'Digital Portal Launch', description: 'SDO Cabuyao SHS Portal goes live providing centralized access to issuances' },
    { year: '2024', title: 'Partnership Expansion', description: 'Expanded partnerships with private and public SHS schools in the region' },
    { year: '2023', title: 'Quality Assurance', description: 'Implementation of comprehensive quality assurance measures for SHS programs' },
  ];

  const team = [
    { name: 'Dr. Maria Clara Santos', role: 'Program Coordinator', initial: 'M' },
    { name: 'Mr. Jose Miguel Reyes', role: 'Curriculum Specialist', initial: 'J' },
    { name: 'Mrs. Ana Patricia Lee', role: 'School Liaison Officer', initial: 'A' },
    { name: 'Mr. Rafael Thomas Aquino', role: 'Technical Support', initial: 'R' },
  ];

  return (
    <main className="about-page" role="main" aria-label="About">
      {/* Hero Section */}
      <section className="about-hero" aria-labelledby="about-title">
        <div className="about-hero__content">
          <h1 id="about-title" className="about-hero__title">About SDO Cabuyao SHS Portal</h1>
          <p className="about-hero__subtitle">
            Your central hub for Senior High School news, documents, and resources for Building Futures
          </p>
        </div>
      </section>

      {/* Stats Highlight */}
      <section className="about-highlights" aria-labelledby="highlights-title">
        <h2 id="highlights-title" className="visually-hidden">Portal Highlights</h2>
        {stats.map((stat, index) => (
          <div key={index} className="highlight-item">
            <span className="highlight-item__value">{stat.value}</span>
            <span className="highlight-item__label">{stat.label}</span>
          </div>
        ))}
      </section>

      {/* Mission Vision Section */}
      <section className="mv-section" aria-labelledby="mv-title">
        <h2 id="mv-title" className="visually-hidden">Mission and Vision</h2>
        <div className="mv-card">
          <div className="mv-card__icon">🎯</div>
          <h3 className="mv-card__title">Our Mission</h3>
          <p className="mv-card__content">
            The SDO Cabuyao City Senior High School Portal provides a centralized platform for accessing official memoranda, policy issuances, and important resources for schools and stakeholders. We are committed to building futures through accessible education.
          </p>
        </div>
        <div className="mv-card">
          <div className="mv-card__icon">💡</div>
          <h3 className="mv-card__title">Our Vision</h3>
          <p className="mv-card__content">
            To become the leading educational resource hub in the region, providing seamless access to information and services for all SHS stakeholders. We envision empowered learners ready for the future.
          </p>
        </div>
      </section>

      {/* History Timeline */}
      <section className="history-section" aria-labelledby="history-title">
        <header className="section-heading">
          <h2 id="history-title" className="section-heading__title">Our Journey</h2>
          <p className="section-heading__subtitle">Milestones in the development of SHS programs in SDO Cabuyao</p>
        </header>
        <div className="timeline">
          {timeline.map((item, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-item__marker"></div>
              <span className="timeline-item__year">{item.year}</span>
              <h3 className="timeline-item__title">{item.title}</h3>
              <p className="timeline-item__description">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section" aria-labelledby="team-title">
        <header className="section-heading">
          <h2 id="team-title" className="section-heading__title">Meet Our Team</h2>
          <p className="section-heading__subtitle">The dedicated professionals behind the SHS Program</p>
        </header>
        <div className="team-grid">
          {team.map((member, index) => (
            <div key={index} className="team-card">
              <div className="team-card__avatar">{member.initial}</div>
              <h3 className="team-card__name">{member.name}</h3>
              <p className="team-card__role">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="about-cta" aria-labelledby="contact-cta-title">
        <h2 id="contact-cta-title" className="about-cta__title">Get in Touch</h2>
        <p className="about-cta__text">
          Have questions about the SHS Program or need assistance? Contact us below.
        </p>
        <div className="contact-info">
          <p><strong>SDO Cabuyao City</strong></p>
          <p>Cabuyao City, Laguna, Philippines</p>
          <p>Email: info@sdocabuyao.edu.ph</p>
          <p>Phone: (049) 123-4567</p>
        </div>
        <Link to="/issuances" className="about-cta__button">
          Browse Issuances
        </Link>
      </section>
    </main>
  );
}
