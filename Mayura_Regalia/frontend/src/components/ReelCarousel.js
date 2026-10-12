import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ReelCarousel.css';

const ReelCarousel = ({ slides }) => {
  const trackRef = useRef(null);
  const slideRefs = useRef([]);
  const videoRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mutedMap, setMutedMap] = useState(() => slides.map(() => true));

  const scrollToIndex = (index) => {
    const clamped = (index + slides.length) % slides.length;
    const el = slideRefs.current[clamped];
    if (el && trackRef.current) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
    setActiveIndex(clamped);
  };

  const toggleMute = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    const vid = videoRefs.current[index];
    if (vid) {
      vid.muted = !vid.muted;
      setMutedMap((prev) => {
        const next = [...prev];
        next[index] = vid.muted;
        return next;
      });
    }
  };

  // All videos autoplay continuously (this is what reliably paints real
  // frames for every slide - browsers can silently fail to render a frame
  // for a video that's only played/primed briefly). The one thing we fix on
  // top of that is the original complaint: a slide should always start from
  // the beginning the moment it becomes active, not resume wherever its
  // background loop happened to be.
  useEffect(() => {
    const vid = videoRefs.current[activeIndex];
    if (!vid) return;
    try { vid.currentTime = 0; } catch { /* not ready yet */ }
  }, [activeIndex]);

  // Keep activeIndex in sync when the user scrolls/swipes manually
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    let timeout;
    const handleScroll = () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        const trackRect = track.getBoundingClientRect();
        let closest = 0;
        let closestDist = Infinity;
        slideRefs.current.forEach((el, idx) => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const dist = Math.abs(rect.left - trackRect.left);
          if (dist < closestDist) {
            closestDist = dist;
            closest = idx;
          }
        });
        setActiveIndex(closest);
      }, 120);
    };

    track.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      track.removeEventListener('scroll', handleScroll);
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="reel-carousel">
      <button
        type="button"
        className="reel-nav reel-nav-prev"
        onClick={() => scrollToIndex(activeIndex - 1)}
        aria-label="Previous video"
      >
        ‹
      </button>

      <div className="reel-track" ref={trackRef}>
        {slides.map((slide, index) => (
          <div
            className={`reel-slide ${index === activeIndex ? 'is-active' : ''}`}
            key={slide.title}
            ref={(el) => { slideRefs.current[index] = el; }}
          >
            <Link to={slide.link} className="reel-slide-card">
              <video
                ref={(el) => { videoRefs.current[index] = el; }}
                className="reel-slide-media"
                src={slide.video}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                aria-hidden="true"
              />
              <div className="reel-slide-scrim" aria-hidden="true" />

              <div className="reel-slide-top">
                <span className="reel-brand">MAYURA REGALIA</span>
                <button
                  type="button"
                  className="reel-icon-btn"
                  onClick={(e) => toggleMute(e, index)}
                  aria-label={mutedMap[index] ? 'Unmute video' : 'Mute video'}
                >
                  {mutedMap[index] ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                      <path d="M18.5 6a9 9 0 0 1 0 12" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="reel-slide-copy">
                <span className="reel-slide-eyebrow">{slide.eyebrow}</span>
                <h3>{slide.title}</h3>
              </div>

              <div className="reel-slide-chip">
                {slide.chipImage && (
                  <span className="reel-chip-thumb"><img src={slide.chipImage} alt="" /></span>
                )}
                <span className="reel-chip-text">{slide.chipText}</span>
                <span className="reel-chip-arrow" aria-hidden="true">→</span>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="reel-nav reel-nav-next"
        onClick={() => scrollToIndex(activeIndex + 1)}
        aria-label="Next video"
      >
        ›
      </button>

      <div className="reel-dots">
        {slides.map((slide, index) => (
          <button
            type="button"
            key={slide.title}
            className={index === activeIndex ? 'active' : ''}
            onClick={() => scrollToIndex(index)}
            aria-label={`Go to ${slide.title} video`}
          />
        ))}
      </div>
    </div>
  );
};

export default ReelCarousel;
