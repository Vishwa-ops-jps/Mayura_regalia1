import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import FilterBar from '../components/FilterBar';
import productService from '../services/productService';
import { getCategories } from '../data/products';
import '../styles/Shop.css';

const Shop = () => {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(category || '');
  const [selectedSort, setSelectedSort] = useState('featured');
  const categories = getCategories();

  useEffect(() => {
    if (category) {
      productService.getProductsByCategory(category).then(setProducts);
      setSelectedCategory(category);
    } else {
      productService.getAllProducts().then(setProducts);
      setSelectedCategory('');
    }
  }, [category]);

  useEffect(() => {
    let sorted = [...products];

    if (selectedCategory && selectedCategory !== 'all') {
      sorted = sorted.filter(
        (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    switch (selectedSort) {
      case 'price-low':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        sorted.reverse();
        break;
      case 'featured':
      default:
        break;
    }

    setFilteredProducts(sorted);
  }, [products, selectedCategory, selectedSort]);

  return (
    <div className="shop-page">
      <div className="shop-header">
        <h1>Shop</h1>
        <p>Discover our premium collection of artificial jewellery</p>
      </div>

      <FilterBar
        selectedCategory={selectedCategory}
        selectedSort={selectedSort}
        onCategoryChange={setSelectedCategory}
        onSortChange={setSelectedSort}
        categories={categories}
      />

      <ProductGrid products={filteredProducts} />
    </div>
  );
};

export default Shop;
