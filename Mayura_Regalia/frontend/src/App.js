import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Search from './pages/Search';
import CustomerLogin from './pages/CustomerLogin';
import CustomerSignup from './pages/CustomerSignup';
import CustomerForgotPassword from './pages/CustomerForgotPassword';
import CustomerAccount from './pages/CustomerAccount';
import Wishlist from './pages/Wishlist';
import NotFound from './pages/NotFound';
import PolicyPage from './pages/PolicyPage';
import Contact from './pages/Contact';
import TrackOrder from './pages/TrackOrder';
import AdminLogin from './admin/pages/AdminLogin';
import AdminLayout from './admin/layout/AdminLayout';
import AdminDashboardPage from './admin/pages/Dashboard';
import AdminProducts from './admin/pages/Products';
import AdminCategories from './admin/pages/Categories';
import AdminCollections from './admin/pages/Collections';
import AdminInventory from './admin/pages/Inventory';
import AdminOrders from './admin/pages/Orders';
import AdminPayments from './admin/pages/Payments';
import AdminCustomers from './admin/pages/Customers';
import AdminGifts from './admin/pages/Gifts';
import AdminOffers from './admin/pages/Offers';
import AdminBanners from './admin/pages/Banners';
import AdminReviews from './admin/pages/Reviews';
import AdminReports from './admin/pages/Reports';
import AdminSettings from './admin/pages/Settings';
import AdminHero from './admin/pages/HeroSettings';
import AdminReturns from './admin/pages/Returns';
import './styles/App.css';

// Browser-tab titles for the main storefront pages (policy and contact pages set their own).
const PAGE_TITLES = {
  '/': 'MAYURA REGALIA - Premium Jewellery',
  '/shop': 'Shop All Jewellery | MAYURA REGALIA',
  '/cart': 'Your Cart | MAYURA REGALIA',
  '/checkout': 'Checkout | MAYURA REGALIA',
  '/wishlist': 'Wishlist | MAYURA REGALIA',
  '/login': 'Login | MAYURA REGALIA',
  '/signup': 'Create Account | MAYURA REGALIA',
  '/account': 'My Account | MAYURA REGALIA',
  '/search': 'Search | MAYURA REGALIA',
  '/order-success': 'Order Confirmed | MAYURA REGALIA',
};

function AppLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (PAGE_TITLES[location.pathname]) document.title = PAGE_TITLES[location.pathname];
  }, [location.pathname]);

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/collections" element={<AdminCollections />} />
          <Route path="/admin/inventory" element={<AdminInventory />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/returns" element={<AdminReturns />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route path="/admin/gifts" element={<AdminGifts />} />
          <Route path="/admin/offers" element={<AdminOffers />} />
          <Route path="/admin/banners" element={<AdminBanners />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/hero" element={<AdminHero />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  return (
    <>
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/privacy-policy" element={<PolicyPage />} />
          <Route path="/terms-and-conditions" element={<PolicyPage />} />
          <Route path="/shipping-policy" element={<PolicyPage />} />
          <Route path="/returns-policy" element={<PolicyPage />} />
          <Route path="/:category" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/search" element={<Search />} />
          <Route path="/login" element={<CustomerLogin />} />
          <Route path="/signup" element={<CustomerSignup />} />
          <Route path="/forgot-password" element={<CustomerForgotPassword />} />
          <Route path="/account" element={<CustomerAccount />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <Router>
          <AppLayout />
        </Router>
      </WishlistProvider>
    </CartProvider>
  );
}

export default App;
