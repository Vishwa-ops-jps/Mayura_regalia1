import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/CategoryCard.css';

const CategoryCard = ({ name, image, link }) => {
  return (
    <Link to={link} className="category-card">
      <div className="category-image">
        <img
          src={image}
          alt={name}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x300?text=' + name;
          }}
        />
      </div>
      <h3 className="category-name">{name}</h3>
    </Link>
  );
};

export default CategoryCard;
