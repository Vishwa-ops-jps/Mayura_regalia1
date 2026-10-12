import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import customerAuthService, { AUTH_CHANGE_EVENT } from '../services/customerAuthService';
import wishlistService from '../services/wishlistService';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [ids, setIds] = useState([]);

  const refresh = useCallback(async () => {
    if (!customerAuthService.isAuthenticated()) {
      setIds([]);
      return;
    }
    try {
      setIds(await wishlistService.getIds());
    } catch (error) {
      // Expired/invalid session: treat as logged out rather than showing stale hearts.
      if (error.status === 401 || error.status === 403) customerAuthService.logout();
      setIds([]);
    }
  }, []);

  // Load on start, and reload whenever someone logs in / signs up / logs out
  // so each account always sees only its own wishlist.
  useEffect(() => {
    refresh();
    window.addEventListener(AUTH_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, refresh);
  }, [refresh]);

  const isInWishlist = (productId) => ids.includes(Number(productId));

  // Returns { needsLogin: true } when nobody is logged in so the caller can
  // send them to the login page.
  const toggleWishlist = async (productId) => {
    if (!customerAuthService.isAuthenticated()) return { needsLogin: true };

    const id = Number(productId);
    const wasSaved = ids.includes(id);
    // Optimistic update so the heart responds instantly; rolled back on error.
    setIds((prev) => (wasSaved ? prev.filter((x) => x !== id) : [...prev, id]));
    try {
      if (wasSaved) await wishlistService.remove(id);
      else await wishlistService.add(id);
      return { added: !wasSaved };
    } catch (error) {
      setIds((prev) => (wasSaved ? [...prev, id] : prev.filter((x) => x !== id)));
      if (error.status === 401 || error.status === 403) {
        customerAuthService.logout();
        return { needsLogin: true };
      }
      return { error: error.message };
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlistIds: ids, wishlistCount: ids.length, isInWishlist, toggleWishlist, refreshWishlist: refresh }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
