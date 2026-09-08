import React from 'react';
import '../styles/FilterBar.css';

const FilterBar = ({
  selectedCategory,
  selectedSort,
  onCategoryChange,
  onSortChange,
  categories,
}) => {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label htmlFor="category">Category:</label>
        <select
          id="category"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="filter-select"
        >
          <option value="">All</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="sort">Sort:</label>
        <select
          id="sort"
          value={selectedSort}
          onChange={(e) => onSortChange(e.target.value)}
          className="filter-select"
        >
          <option value="featured">Featured</option>
          <option value="price-low">Price Low to High</option>
          <option value="price-high">Price High to Low</option>
          <option value="newest">Newest</option>
        </select>
      </div>
    </div>
  );
};

export default FilterBar;
