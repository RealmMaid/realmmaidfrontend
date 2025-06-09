import React, { useState, useEffect, useCallback } from 'react';

// --- Real Dependencies ---
// Correctly import the configured API instance.
import API from '../api/axios.js';

/**
 * A reusable modal component to display the detailed contents of a single order.
 */
const OrderDetailsModal = ({ show, onClose, order, loading }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="modal-backdrop" style={{ display: 'flex', position: 'fixed', zIndex: 1051 }}>
      <div className="modal-content">
        <div className="modal-header">
          <h4>{loading ? 'Loading Details...' : `Order Details: #${order?.id}`}</h4>
          <button type="button" className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
            {loading ? (
                <div className="loading-spinner-container"><div className="loading-spinner"></div></div>
            ) : order ? (
                <>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)'}}>
                        <div><strong>Customer:</strong> {order.userFirstName || ''} {order.userLastName || ''}</div>
                        <div><strong>Email:</strong> {order.userEmail || 'N/A'}</div>
                        <div><strong>Order Date:</strong> {new Date(order.order_date).toLocaleString()}</div>
                        <div><strong>Total Amount:</strong> ${parseFloat(order.total_amount).toFixed(2)}</div>
                        <div><strong>Status:</strong> <span className={`badge ${order.status?.toLowerCase()}`}>{order.status}</span></div>
                    </div>
                    <hr style={{margin: 'var(--spacing-md) 0', border: 'none', borderTop: '1px solid var(--card-border)'}}/>
                    <h5>Items in this Order ({order.items?.length || 0})</h5>
                    <div className="table-container" style={{maxHeight: '200px', overflowY: 'auto'}}>
                       <table className="admin-table simple">
                           <thead><tr><th>Product</th><th>Quantity</th><th>Price Each</th><th>Subtotal</th></tr></thead>
                           <tbody>
                                {order.items && order.items.length > 0 ? order.items.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.product_name_at_order}</td>
                                        <td>{item.quantity}</td>
                                        <td>${parseFloat(item.price_at_order).toFixed(2)}</td>
                                        <td>${parseFloat(item.price_at_order * item.quantity).toFixed(2)}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4">No item details found.</td></tr>
                                )}
                           </tbody>
                       </table>
                    </div>
                </>
            ) : (
                <p>Could not load order details.</p>
            )}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary-action" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

/**
 * Renders the Order Management tab, allowing admins to view all orders and their details.
 */
function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // A separate loading state for the modal to avoid showing the main page loader.
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Fetches the list of all orders from the backend.
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // API call to GET /api/admin/orders from adminRoutes.js
      const response = await API.get('/admin/orders');
      if (response.data.success) {
        setOrders(response.data.orders || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders.');
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Fetches the detailed information for a specific order.
  const handleViewDetails = async (orderId) => {
    setSelectedOrder({ id: orderId }); // Set a temporary order to show the modal immediately.
    setDetailsLoading(true);
    setError('');
    
    try {
        // API call to GET /api/admin/orders/:orderId
        const response = await API.get(`/admin/orders/${orderId}`);
        if(response.data.success) {
            setSelectedOrder(response.data.details); 
        } else {
             throw new Error(response.data.message || 'Failed to fetch order details.');
        }
    } catch(err) {
        setError(err.response?.data?.message || 'Could not fetch order details.');
        setSelectedOrder(null); // Close modal on error
    } finally {
        setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
  };
  
  if (loading) {
    return <div className="loading-spinner-container"><div className="loading-spinner"></div><p>Loading Orders...</p></div>;
  }

  return (
    <>
      <OrderDetailsModal
        show={!!selectedOrder}
        onClose={closeModal}
        order={selectedOrder}
        loading={detailsLoading}
      />
      
      <div className="card">
        <div className="card-header">
          <h2>Order Management</h2>
        </div>
        <div className="card-content">
            {error && <div className="message-area error" style={{ display: 'block' }}>{error}</div>}

            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer Name</th>
                    <th>Customer Email</th>
                    <th>Order Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Items</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? orders.map(order => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{`${order.firstName || ''} ${order.lastName || ''}`.trim() || 'N/A'}</td>
                      <td>{order.email}</td>
                      <td>{new Date(order.order_date).toLocaleString()}</td>
                      <td>${parseFloat(order.total_amount).toFixed(2)}</td>
                      <td><span className={`badge ${order.status?.toLowerCase()}`}>{order.status}</span></td>
                      <td style={{textAlign: 'center'}}>{order.itemCount}</td>
                      <td>
                        <button onClick={() => handleViewDetails(order.id)} className="btn btn-sm btn-secondary-action">View Details</button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '1rem' }}>No orders have been placed yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
        </div>
      </div>
    </>
  );
}

export default OrderManagement;
