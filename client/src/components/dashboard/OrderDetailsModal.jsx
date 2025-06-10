import React from 'react';

// --- A new, cute modal for showing order details! ---
const OrderDetailsModal = ({ order, onClose }) => {
    if (!order) return null;

    return (
        <div className="modal-backdrop active">
            <div className="modal-content">
                <div className="modal-header">
                    <h4>Order Details for #{order.orderId}</h4>
                    <button type="button" className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <div className="order-details-grid">
                        <div><strong>Date:</strong> {new Date(order.orderDate).toLocaleString()}</div>
                        <div><strong>Total:</strong> ${parseFloat(order.totalAmount).toFixed(2)}</div>
                        <div><strong>Status:</strong> <span className={`status-badge status-${order.orderStatus?.toLowerCase()}`}>{order.orderStatus}</span></div>
                    </div>
                    {order.shippingAddressLine1 && (
                        <div className="shipping-address">
                            <h5>Shipped To:</h5>
                            <p>
                                {order.shippingAddressLine1}<br />
                                {order.shippingAddressLine2 && <>{order.shippingAddressLine2}<br /></>}
                                {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}<br />
                                {order.shippingCountry}
                            </p>
                        </div>
                    )}
                    <hr />
                    <h5>Items in this Order ✨</h5>
                    <div className="order-items-container">
                        {order.items?.map(item => (
                            <div key={item.product_id} className="order-item-card">
                                <span>{item.productName} (x{item.quantity})</span>
                                <span>${parseFloat(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="btn btn-secondary-action" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsModal;