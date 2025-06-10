import React from 'react';
import ProductCard from '../components/ProductCard';
import './ProductsPage.css'; // We'll create this file for styles next!

// Our cute fake products! We can add real ones later!
const mockProducts = [
  { id: 1, name: 'Sparkle Potion', price: 15.99, imageUrl: 'https://via.placeholder.com/300' },
  { id: 2, name: 'Pixel Sword', price: 24.50, imageUrl: 'https://via.placeholder.com/300' },
  { id: 3, name: 'Cutie Pie Hat', price: 12.00, imageUrl: 'https://via.placeholder.com/300' },
  { id: 4, name: 'Moonbeam Wand', price: 32.75, imageUrl: 'https://via.placeholder.com/300' },
];

function ProductsPage() {
  return (
    <div className="page-container">
      <h2>Our Magical Wares ✨</h2>
      <div className="product-grid">
        {mockProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default ProductsPage;