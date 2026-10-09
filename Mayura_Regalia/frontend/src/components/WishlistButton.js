import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import '../styles/Wishlist.css';

// Heart toggle used on product cards (variant "icon") and on the product
// page (variant "full", with a text label).
const WishlistButton = ({ productId, variant = 'icon' }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const saved = isInWishlist(productId);

  const handleClick = async (e) => {
    // The card's image is wrapped in a Link - don't navigate to the product.
    e.preventDefault();
    e.stopPropagation();
    const result = await toggleWishlist(productId);
    if (result.needsLogin) {
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
    }
  };

  const label = saved ? 'Remove from wishlist' : 'Add to wishlist';

  return (
    <button
      type="button"
      className={`wishlist-btn wishlist-btn-${variant}${saved ? ' is-saved' : ''}`}
      onClick={handleClick}
      aria-label={label}
      aria-pressed={saved}
      title={label}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.3 5 6.4 5c1.9 0 3.3 1 4.1 2.3h3C14.3 6 15.7 5 17.6 5c3.1 0 4.9 3 3.7 6.3-1.8 4.6-9.3 9.2-9.3 9.2z" />
      </svg>
      {variant === 'full' && <span>{saved ? 'Saved to Wishlist' : 'Add to Wishlist'}</span>}
    </button>
  );
};

export default WishlistButton;
