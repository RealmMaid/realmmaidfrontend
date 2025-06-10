import React from 'react';
import { useWishlistStore } from '../hooks/useWishlistStore'; // Importing our new store!

function ProductCard({ product }) {
  // We get the wishlist and the toggle function from our store!
  const { wishlist, toggleWishlist } = useWishlistStore();
  const isInWishlist = wishlist.includes(product.id);

  const handleWishlistClick = () => {
    toggleWishlist(product.id);
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img src={product.imageUrl} alt={product.name} />
        <button onClick={handleWishlistClick} className="wishlist-button">
          {isInWishlist ? '💖' : '🤍'} {/* A full heart or an empty heart! */}
        </button>
      </div>
      <div className="product-info">
        <h4>{product.name}</h4>
        <p>${product.price.toFixed(2)}</p>
      </div>
      <button className="btn-add-to-cart">Add to Cart</button>
    </div>
  );
}

export default ProductCard;