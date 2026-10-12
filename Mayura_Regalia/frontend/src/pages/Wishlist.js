import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import customerAuthService from '../services/customerAuthService';
import wishlistService from '../services/wishlistService';
import { useWishlist } from '../context/WishlistContext';
import '../styles/Wishlist.css';

const Wishlist = () => {
  const { wishlistIds } = useWishlist();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const loggedIn = customerAuthService.isAuthenticated();

  useEffect(() => {
    document.title = 'My Wishlist | Mayura Regalia';
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    let active = true;
    wishlistService
      .getWishlist()
      .then((data) => { if (active) { setItems(data); setLoading(false); } })
      .catch((err) => { if (active) { setError(err.message); setLoading(false); } });
    return () => { active = false; };
  }, [loggedIn]);

  if (!loggedIn) return <Navigate to="/login" replace state={{ from: '/wishlist' }} />;

  // Filtering by the live id list makes an item disappear the moment its
  // heart is un-tapped, without another server round trip.
  const visible = items.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="wishlist-page">
      <div className="wishlist-header">
        <h1>My Wishlist</h1>
        {!loading && !error && visible.length > 0 && (
          <p>{visible.length} saved item{visible.length === 1 ? '' : 's'}</p>
        )}
      </div>

      {loading && <div className="wishlist-state">Loading your wishlist...</div>}
      {!loading && error && <div className="wishlist-state wishlist-state-error">{error}</div>}
      {!loading && !error && visible.length === 0 && (
        <div className="wishlist-state">
          <p>Your wishlist is empty.</p>
          <p>Tap the heart on any product to save it here.</p>
          <Link to="/shop" className="btn btn-primary">Browse Collection</Link>
        </div>
      )}
      {!loading && !error && visible.length > 0 && <ProductGrid products={visible} />}
    </div>
  );
};

export default Wishlist;
