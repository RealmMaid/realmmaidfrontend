import React, { useState, useEffect } from 'react';
import API from '../../api/axios';
import OrderDetailsModal from './OrderDetailsModal'; // We import our cute modal!

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await API.get('/user/orders');
                if (data.success) {
                    setOrders(data.orders);
                } else {
                    throw new Error(data.message);
                }
            } catch (err) {
                setError('Oopsie! We had a little trouble fetching your orders. >.<');
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const handleViewDetails = async (orderId) => {
        setDetailsLoading(true);
        setError('');
        try {
            const { data } = await API.get(`/user/orders/${orderId}`);
            if (data.success) {
                setSelectedOrderDetails(data.details);
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            setError('Sowwy! We couldn\'t grab the deets for that order.');
        } finally {
            setDetailsLoading(false);
        }
    };

    if (loading) return <p>Fetching your order history, one moment cutie...</p>;
    if (error) return <div className="message-area error" style={{display:'block'}}>{error}</div>;

    return (
        <>
            <OrderDetailsModal order={selectedOrderDetails} onClose={() => setSelectedOrderDetails(null)} />
            <div className="card">
                <h3>Your Fabulous Orders! 🛍️</h3>
                {detailsLoading && <p>Getting the juicy details...</p>}
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length > 0 ? (
                                orders.map(order => (
                                    <tr key={order.orderId}>
                                        <td>#{order.orderId}</td>
                                        <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                                        <td>{order.item_summary || 'N/A'}</td>
                                        <td>${parseFloat(order.totalAmount).toFixed(2)}</td>
                                        <td>
                                            <span className={`status-badge status-${order.orderStatus?.toLowerCase()}`}>{order.orderStatus}</span>
                                        </td>
                                        <td>
                                            <button onClick={() => handleViewDetails(order.orderId)} className="btn btn-sm btn-secondary-action" disabled={detailsLoading}>
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center">You have no orders yet, silly! Time for a shopping spree? ✨</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default MyOrders;