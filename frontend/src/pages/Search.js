import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import productService from '../services/productService';
import '../styles/Search.css';

const Search = () => {
  const [searchParams] = useSearchParams();
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (query.trim()) {
      setLoading(true);
      productService
        .searchProducts(query)
        .then((results) => {
          setSearchResults(results);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      setSearchResults([]);
    }
  }, [query]);

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Search Results</h1>
        {query && (
          <p>
            Results for "<strong>{query}</strong>"
          </p>
        )}
      </div>

      {loading ? (
        <div className="loading">Searching...</div>
      ) : searchResults.length > 0 ? (
        <>
          <p className="result-count">
            Found {searchResults.length} product{searchResults.length !== 1 ? 's' : ''}
          </p>
          <ProductGrid products={searchResults} />
        </>
      ) : (
        <div className="no-results">
          <p>No products found for "{query}"</p>
          <p>Try searching with different keywords.</p>
        </div>
      )}
    </div>
  );
};

export default Search;
