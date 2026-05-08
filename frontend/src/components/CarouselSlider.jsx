import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getAllCarouselSlides } from '../services/carousel';
import { resolveFileUrl } from '../services/api';

/**
 * CarouselSlider - Hero carousel with automatic rotation
 * Displays latest news, achievements, and announcements from the database
 */
export function CarouselSlider() {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  
  useEffect(() => {
    const loadSlides = async () => {
      try {
        const data = await getAllCarouselSlides();
        const slidesData = data || [];
        setSlides(slidesData);

        // Check for slide ID in URL and set current index
        const params = new URLSearchParams(location.search);
        const slideId = params.get('slide');
        if (slideId && slidesData.length > 0) {
          const index = slidesData.findIndex(s => String(s.id) === String(slideId));
          if (index !== -1) {
            setCurrentIndex(index);
          }
        }
      } catch (err) {
        console.error('Failed to load carousel slides:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSlides();
  }, [location.search]);

  // Auto-rotation every 5 seconds
  useEffect(() => {
    if (isPaused || slides.length <= 1) return undefined;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);
  
  const goToSlide = (index) => {
    setCurrentIndex(index);
  };
  
  const goToPrev = (e) => {
    e.preventDefault();
    setCurrentIndex(prev => prev === 0 ? slides.length - 1 : prev - 1);
  };
  
  const goToNext = (e) => {
    e.preventDefault();
    setCurrentIndex(prev => (prev + 1) % slides.length);
  };

  if (loading) return <div className="hero-carousel-loading" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (slides.length === 0) return null;

  return (
    <div className="hero-carousel">
      <div 
        id="mainCarousel" 
        className="carousel slide" 
        data-bs-ride="carousel"
        data-bs-interval="5000"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Carousel Indicators */}
        <div
          className="carousel-indicators"
          style={{
            position: 'absolute',
            margin: 0,
            bottom: '0.7rem',
            left: '50%',
            transform: 'translateX(-50%)',
            justifyContent: 'center',
            width: 'fit-content',
            padding: '0.28rem 0.5rem',
            borderRadius: '999px',
            background: 'rgba(15, 23, 42, 0.72)',
            zIndex: 5,
          }}
        >
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              data-bs-target="#mainCarousel"
              data-bs-slide-to={idx}
              className={idx === currentIndex ? 'active' : ''}
              aria-current={idx === currentIndex ? 'true' : 'false'}
              aria-label={`Slide ${idx + 1}`}
              onClick={() => goToSlide(idx)}
              style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                margin: '0 4px',
                border: '1px solid rgba(255,255,255,0.85)',
                backgroundColor: idx === currentIndex ? '#ffffff' : 'rgba(255,255,255,0.45)',
                opacity: 1,
              }}
            />
          ))}
        </div>
        
        {/* Carousel Inner */}
        <div className="carousel-inner">
          {slides.map((slide, idx) => (
            <div 
              className={`carousel-item ${idx === currentIndex ? 'active' : ''}`} 
              key={slide.id || idx}
              data-bs-interval="5000"
            >
              {(() => {
                const category = String(slide.category || '').trim();
                const title = String(slide.title || '').trim();
                const description = String(slide.description || '').trim();
                const ctaText = String(slide.cta_text || '').trim();
                const hasDetails = Boolean(category || title || description || ctaText);
                const imageAlt = title || 'Carousel slide';
                return (
              <a
                href={slide.cta_link || '#'}
                target="_blank"
                rel="noreferrer"
                className="carousel-slide-link"
                aria-label={`Open: ${imageAlt}`}
                onClick={(e) => !slide.cta_link && e.preventDefault()}
                style={{ display: 'block', textDecoration: 'none' }}
              >
                <div
                  style={{
                    position: 'relative',
                    height: 'clamp(280px, 52vw, 460px)',
                    background: '#0f172a',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={resolveFileUrl(slide.image_path)}
                    aria-hidden="true"
                    alt=""
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      filter: 'blur(14px) brightness(0.72)',
                      transform: 'scale(1.08)',
                      opacity: 0.75,
                    }}
                  />
                  <img
                    src={resolveFileUrl(slide.image_path)}
                    className="d-block w-100"
                    alt={imageAlt}
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      height: '100%',
                      objectFit: 'contain',
                      objectPosition: 'center',
                    }}
                  />
                </div>

                {hasDetails && (
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderTop: 'none',
                      padding: '0.75rem 1rem',
                      color: '#0f172a',
                    }}
                  >
                    {category && (
                      <span
                        className="badge mb-2"
                        style={{
                          backgroundColor: '#e2e8f0',
                          color: '#0f172a',
                          fontSize: '0.68rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.6px',
                        }}
                      >
                        {category}
                      </span>
                    )}
                    {title && (
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 'clamp(1rem, 2vw, 1.35rem)',
                          lineHeight: 1.2,
                          fontWeight: 700,
                          color: '#0f172a',
                        }}
                      >
                        {title}
                      </h3>
                    )}
                    {description && (
                      <p
                        style={{
                          margin: '0.35rem 0 0',
                          fontSize: '0.93rem',
                          color: '#334155',
                          lineHeight: 1.35,
                        }}
                      >
                        {description}
                      </p>
                    )}
                    {ctaText && (
                      <div style={{ marginTop: '0.55rem' }}>
                        <span className="btn btn-primary btn-sm px-3 py-1">{ctaText}</span>
                      </div>
                    )}
                  </div>
                )}
                {!hasDetails && (
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderTop: 'none',
                      padding: '0.35rem',
                    }}
                  />
                )}
                {slide.cta_link && (
                  <p
                    className="mb-0"
                    style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      padding: '0.35rem 0.95rem 0.2rem',
                      background: '#ffffff',
                    }}
                  >
                    Tap/click image to open link
                  </p>
                )}
              </a>
                );
              })()}
            </div>
          ))}
        </div>
        
        {/* Carousel Controls */}
        <button 
          className="carousel-control-prev" 
          type="button"
          onClick={goToPrev}
          aria-label="Previous slide"
          style={{ width: '5%' }}
        >
          <span 
            className="carousel-control-prev-icon" 
            aria-hidden="true"
            style={{ 
              backgroundColor: 'rgba(59, 76, 184, 0.8)',
              borderRadius: '50%',
              padding: '1rem'
            }}
          />
        </button>
        <button 
          className="carousel-control-next" 
          type="button"
          onClick={goToNext}
          aria-label="Next slide"
          style={{ width: '5%' }}
        >
          <span 
            className="carousel-control-next-icon" 
            aria-hidden="true"
            style={{ 
              backgroundColor: 'rgba(59, 76, 184, 0.8)',
              borderRadius: '50%',
              padding: '1rem'
            }}
          />
        </button>
      </div>
    </div>
  );
}

export default CarouselSlider;
