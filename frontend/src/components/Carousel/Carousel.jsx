import React, { useState, useEffect, useCallback } from 'react';
import { sliderImages } from '../../services/mockData';
import './Carousel.css';

// Transform sliderImages to match Carousel format
const carouselItems = sliderImages.map(item => ({
  id: item.id,
  image: item.src,
  title: item.title,
  description: item.caption,
  cta: 'Learn More',
  category: item.category
}));

/**
 * Carousel - Hero carousel with automatic rotation and navigation
 * 
 * @param {Array} items - Carousel items (optional, uses default if not provided)
 * @param {number} autoRotateInterval - Auto-rotate interval in milliseconds (default: 5000)
 * @param {boolean} showIndicators - Show navigation dots (default: true)
 * @param {boolean} showArrows - Show navigation arrows (default: true)
 * @param {function} onSlideChange - Callback when slide changes
 */
const Carousel = ({
  items = carouselItems,
  autoRotateInterval = 5000,
  showIndicators = true,
  showArrows = true,
  onSlideChange
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-rotation
  useEffect(() => {
    if (!autoRotateInterval) return;

    const interval = setInterval(() => {
      goToNext();
    }, autoRotateInterval);

    return () => clearInterval(interval);
  }, [autoRotateInterval, currentIndex]);

  const goToSlide = useCallback((index) => {
    if (isAnimating || index === currentIndex) return;
    
    setIsAnimating(true);
    setCurrentIndex(index);
    
    if (onSlideChange) {
      onSlideChange(index);
    }

    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  }, [currentIndex, isAnimating, onSlideChange]);

  const goToPrev = useCallback((e) => {
    if (e) {
      e.preventDefault();
    }
    const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
    goToSlide(prevIndex);
  }, [currentIndex, items.length, goToSlide]);

  const goToNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % items.length;
    goToSlide(nextIndex);
  }, [currentIndex, items.length, goToSlide]);

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goToSlide(index);
    }
  };

  return (
    <div 
      className="carousel" 
      role="region" 
      aria-label="Featured content carousel"
      data-carousel
    >
      <div className="carousel__slides">
        {items.map((item, index) => (
          <div
            key={item.id || index}
            className={`carousel__slide ${index === currentIndex ? 'active' : ''}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${items.length}`}
            aria-hidden={index !== currentIndex}
          >
            <img
              src={item.image}
              alt={item.title}
              className="carousel__image"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            <div className="carousel__content">
              <span className="carousel__category">{item.category}</span>
              <h2 className="carousel__title">{item.title}</h2>
              <p className="carousel__description">{item.description}</p>
              {item.cta && (
                <button className="carousel__cta">
                  {item.cta}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showIndicators && (
        <div className="carousel__indicators" role="tablist" aria-label="Carousel slides">
          {items.map((_, index) => (
            <button
              key={index}
              className={`carousel__indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Go to slide ${index + 1}`}
              tabIndex={index === currentIndex ? 0 : -1}
            />
          ))}
        </div>
      )}

      {showArrows && (
        <>
          <button
            className="carousel__arrow carousel__arrow--prev"
            onClick={goToPrev}
            aria-label="Previous slide"
          >
            <span className="carousel__arrow-icon">‹</span>
          </button>
          <button
            className="carousel__arrow carousel__arrow--next"
            onClick={goToNext}
            aria-label="Next slide"
          >
            <span className="carousel__arrow-icon">›</span>
          </button>
        </>
      )}
    </div>
  );
};

export default Carousel;
