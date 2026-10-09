import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/CategoryCard.css';

const CategoryCard = ({ name, image, video, icon = '✦', link, focus = 'center' }) => {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);

  // The bare `autoPlay` attribute can silently fail to render a frame when
  // several videos on the page are all trying to autoplay at once. Explicitly
  // calling play() here (and retrying once metadata is ready) guarantees a
  // real frame is always painted instead of a blank card.
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return undefined;

    const attemptPlay = () => {
      const playPromise = vid.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => { /* will retry via loadeddata below */ });
      }
    };

    attemptPlay();
    vid.addEventListener('loadeddata', attemptPlay);
    return () => vid.removeEventListener('loadeddata', attemptPlay);
  }, [video]);

  const toggleMute = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

  return (
    <Link to={link} className="category-card">
      {video ? (
        <div className="category-image">
          <video
            ref={videoRef}
            src={video}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-label={name}
            style={{ objectPosition: focus }}
          />
          <button type="button" className="category-mute-btn" onClick={toggleMute} aria-label={muted ? 'Unmute video' : 'Mute video'}>
            {muted ? (
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
      ) : image ? (
        <div className="category-image">
          <img
            src={image}
            alt={name}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="category-art" aria-hidden="true">
          <span>{icon}</span>
        </div>
      )}
      <div className="category-overlay" aria-hidden="true" />
      <div className="category-copy">
        <span className="category-kicker">MAYURA REGALIA</span>
        <h3 className="category-name">{name}</h3>
        <span className="category-shop">SHOP NOW</span>
      </div>
    </Link>
  );
};

export default CategoryCard;
