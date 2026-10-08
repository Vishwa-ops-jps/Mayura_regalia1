import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/VideoHighlightCard.css';

const VideoHighlightCard = ({ video, eyebrow, title, link, chipImage, chipText }) => {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);

  const toggleMute = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

  return (
    <Link to={link} className="reel-card">
      <video
        ref={videoRef}
        className="reel-media"
        src={video}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />
      <div className="reel-scrim" aria-hidden="true" />

      <div className="reel-top-actions">
        <button
          type="button"
          className="reel-icon-btn"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute video' : 'Mute video'}
        >
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

      <div className="reel-copy">
        <span className="reel-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>

      {chipText && (
        <div className="reel-chip">
          {chipImage && <span className="reel-chip-thumb"><img src={chipImage} alt="" /></span>}
          <span className="reel-chip-text">{chipText}</span>
          <span className="reel-chip-arrow" aria-hidden="true">→</span>
        </div>
      )}
    </Link>
  );
};

export default VideoHighlightCard;
