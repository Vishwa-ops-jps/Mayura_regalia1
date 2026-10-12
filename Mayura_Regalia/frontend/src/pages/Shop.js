import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import FilterBar from '../components/FilterBar';
import productService from '../services/productService';
import '../styles/Shop.css';

const Shop = () => {
  const { category: routeCategory } = useParams();
  const [searchParams] = useSearchParams();
  const queryCategory = searchParams.get('category');
  const queryMaterial = searchParams.get('material') || '';
  const querySort = searchParams.get('sort') || 'featured';

  const initialCategory = routeCategory || queryCategory || '';

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSort, setSelectedSort] = useState(querySort);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const activeCat = routeCategory || queryCategory || '';
    setSelectedCategory(activeCat);
  }, [routeCategory, queryCategory]);

  useEffect(() => {
    setSelectedSort(querySort);
  }, [querySort]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const filterObj = {
      category: selectedCategory || 'all',
      material: queryMaterial,
    };

    productService
      .getProducts(filterObj)
      .then((data) => {
        if (isMounted) {
          setProducts(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching products:', err);
        if (isMounted) {
          setProducts([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, queryMaterial]);

  useEffect(() => {
    let sorted = [...products];

    // Client-side exact filtering (used when the API is offline and mock data is shown).
    // If an exact filter would leave nothing, keep the server's list: the server falls back to
    // the same match that search uses, so menu links and search always show the same items.
    if (selectedCategory && selectedCategory !== 'all' && !/^gold /i.test(selectedCategory.trim())) {
      const catLower = selectedCategory.toLowerCase().trim();
      const byCategory = sorted.filter((p) => {
        if (!p.category) return false;
        const pCat = p.category.toLowerCase().trim();
        if (catLower === 'jewels') return pCat === 'jewels';
        if (catLower === 'fashion jewels') {
          return ['necklaces', 'earrings', 'bangles', 'rings', 'bridal jewellery', 'bracelets'].includes(pCat);
        }
        if (catLower === 'silver jewellery') return ['silver', 'german silver'].includes(pCat);
        return pCat === catLower;
      });
      if (byCategory.length) sorted = byCategory;
    }

    if (queryMaterial) {
      const matLower = queryMaterial.toLowerCase().trim();
      const byMaterial = sorted.filter((p) => p.material && p.material.toLowerCase().trim() === matLower);
      if (byMaterial.length) sorted = byMaterial;
    }

    switch (selectedSort) {
      case 'price-low':
        sorted.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price-high':
        sorted.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'newest':
        sorted.reverse();
        break;
      case 'featured':
      default:
        break;
    }

    setFilteredProducts(sorted);
  }, [products, selectedCategory, queryMaterial, selectedSort]);

  const pageTitle = useMemo(() => {
    if (selectedCategory && queryMaterial) {
      return `${selectedCategory} - ${queryMaterial}`;
    }
    if (selectedCategory && selectedCategory !== 'all') {
      return selectedCategory;
    }
    return 'Shop';
  }, [selectedCategory, queryMaterial]);

  const isSareesCategory = (selectedCategory || '').toLowerCase().trim() === 'sarees';

  return (
    <div className="shop-page">
      <div className="shop-header">
        <h1>{pageTitle}</h1>
        <p>Discover our exquisite collection celebrating your elegance</p>
      </div>

      {isSareesCategory && (
        <div className="shop-category-video">
          <video src="/videos/blue-saree.mp4" autoPlay loop muted playsInline />
        </div>
      )}

      <FilterBar
        selectedSort={selectedSort}
        onSortChange={setSelectedSort}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--light-text)' }}>
          Loading collection...
        </div>
      ) : (
        <ProductGrid products={filteredProducts} />
      )}
    </div>
  );
};

export default Shop;
