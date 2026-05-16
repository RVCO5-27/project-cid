import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CarouselSlider from '../components/CarouselSlider';
import HomeIssuancesTeaser from '../components/HomeIssuancesTeaser/HomeIssuancesTeaser';
import { getStatsSummary } from '../services/stats';
import './Home.css';

export default function Home() {
  const [stats, setStats] = useState([
    { value: '...', label: 'Private Schools', icon: '🏫' },
    { value: '...', label: 'Public Schools', icon: '🏛️' },
    { value: '...', label: 'Issuances', icon: '📄' },
  ]);

  // Load stats function
  const loadStats = async () => {
    try {
      const data = await getStatsSummary();
      setStats([
        { value: `${data.privateSchools}+`, label: 'Private Schools', icon: '🏫' },
        { value: `${data.publicSchools}+`, label: 'Public Schools', icon: '🏛️' },
        { value: `${data.issuances}+`, label: 'Issuances', icon: '📄' },
      ]);
    } catch (err) {
      console.error('Failed to load real-time stats:', err);
    }
  };

  useEffect(() => {
    // Load stats on mount
    loadStats();

    // Refresh stats every 10 seconds for live updates
    const interval = setInterval(() => {
      loadStats();
    }, 10000);

    // Listen for custom refresh event
    const handleRefreshStats = () => {
      console.log('[Home] Stats refresh triggered');
      loadStats();
    };
    window.addEventListener('refreshHomeStats', handleRefreshStats);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshHomeStats', handleRefreshStats);
    };
  }, []);

  const announcements = [
    {
      id: 'org-chart',
      title: 'Organizational Chart',
      description: 'View the SDO Cabuyao organizational structure',
      icon: '🏢',
      to: '/org-chart',
    },
    {
      id: 'schools',
      title: 'Schools',
      description: 'Explore public and private SHS schools in the region',
      icon: '🏫',
      to: '/schools',
    },
    {
      id: 'shs-program',
      title: 'Strengthened SHS Program',
      description: 'Learn about the Strengthened SHS 2026-2027 program',
      icon: '📖',
      href: 'https://www.deped.gov.ph/strengthened-shs-program/',
      external: true,
    },
  ];

  return (
    <main className="home-page" role="main" aria-label="Home">
      <div className="home-page__inner">
        {/* Hero — single carousel for this page */}
        <section className="home-section home-hero" aria-labelledby="home-title">
          <h1 id="home-title" className="visually-hidden">
            SDO Cabuyao Senior High School Portal
          </h1>
          <CarouselSlider />
        </section>

        {/* Stats */}
        <section className="home-section welcome-section" aria-labelledby="welcome-title">
          <h2 id="welcome-title" className="visually-hidden">
            At a glance
          </h2>
          <div className="welcome-grid">
            {stats.map((stat, index) => (
              <div key={index} className="welcome-card">
                <div className="welcome-card__icon">{stat.icon}</div>
                <span className="welcome-card__value">{stat.value}</span>
                <span className="welcome-card__label">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Announcements */}
        <section className="home-section announcement-section" aria-labelledby="announcement-title">
          <header className="section-header">
            <h2 id="announcement-title" className="section-header__title">
              Announcements
            </h2>
            <p className="section-header__subtitle">Latest news and updates from the portal</p>
          </header>
          <div className="announcement-grid">
            {announcements.map((link) => {
              const Component = link.external ? 'a' : Link;
              const props = link.external 
                ? { href: link.href, target: '_blank', rel: 'noopener noreferrer', className: 'announcement-card' }
                : { to: link.to, className: 'announcement-card' };
              
              return (
                <Component key={link.id} {...props}>
                  <div className="announcement-card__icon">{link.icon}</div>
                  <h3 className="announcement-card__title">{link.title}</h3>
                  <p className="announcement-card__description">{link.description}</p>
                  <span className="announcement-card__link">
                    Explore <span aria-hidden="true">→</span>
                  </span>
                </Component>
              );
            })}
          </div>
        </section>

        {/* Issuances — teaser only; full UI at /issuances */}
        <section className="home-section issuances-section" aria-labelledby="issuances-title">
          <header className="section-header">
            <h2 id="issuances-title" className="section-header__title">
              Issuances &amp; Documents
            </h2>
            <p className="section-header__subtitle">
              Official memoranda, policies, and advisories — explore the full library on the
              Issuances page.
            </p>
          </header>
          <HomeIssuancesTeaser />
        </section>

        {/* CTA */}
        <section className="home-section home-cta" aria-labelledby="cta-title">
          <div className="home-cta__content">
            <h2 id="cta-title" className="home-cta__title">
              Strengthened SHS Program 2026-2027
            </h2>
            <p className="home-cta__text">
              Discover the new enhancements to the Senior High School curriculum and programs
              designed to prepare students for the future.
            </p>
            <Link to="/about" className="home-cta__button">
              Learn More
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
