import React, { useState, useEffect } from 'react';
import API from '../../api/axios'; // Adjust path if necessary

function MyWishlist() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        // This is the new backend endpoint we'll need to create later
        const { data } = await API.get('/user/wishlist');
        if (data.success) {
          setWishlistItems(data.wishlist);
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        setError("Oh no! We couldn't fetch your sparkly wishlist. >.<");
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  if (loading) return <p>Searching for your saved treasures...</p>;
  if (error) return <div className="message-area error" style={{display:'block'}}>{error}</div>;

  return (
    <div className="card">
      <h3>Your Magical Wishlist ✨</h3>
      <div className="wishlist-items-container">
        {wishlistItems.length > 0 ? (
          wishlistItems.map(item => (
            <div key={item.productId} className="wishlist-item-card">
              {/* We can make this fancier later with images! */}
              <h4>{item.productName}</h4>
              <p>${parseFloat(item.price).toFixed(2)}</p>
              <button className="btn btn-sm btn-secondary-action">View Item</button>
            </div>
          ))
        ) : (
          <p>Your wishlist is empty! Let's find some treasures to add. ✨</p>
        )}
      </div>
    </div>
  );
}

export default MyWishlist;