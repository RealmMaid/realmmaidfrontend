import React, { useState, useEffect, useCallback } from 'react';
// --- FIX: We only need our central API instance now! ---
import API from '../api/axios';
import { Link } from 'react-router-dom';

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


// --- Sub-component for the "My Orders" tab ---
const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // The interceptor in API will handle the CSRF token!
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

// --- Sub-component for the "Profile & Settings" tab ---
const ProfileSettings = () => {
    const [profile, setProfile] = useState({});
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    const [loading, setLoading] = useState(true);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await API.get('/user/settings');
                if (data.success) setProfile(data.settings);
                else throw new Error(data.message);
            } catch (err) {
                setProfileError('Sowwy, we couldn\'t get your profile deets! Try refreshing?');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });
    const handlePasswordChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setProfileError('');
        setProfileSuccess('');
        try {
            const { data } = await API.put('/user/settings', profile);
            if (data.success) setProfileSuccess('Your profile is all updated, superstar! 🌟');
            else throw new Error(data.message);
        } catch (err) {
            setProfileError(err.response?.data?.message || 'An oopsie happened while saving! >.<');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');
        if (passwords.newPassword !== passwords.confirmNewPassword) {
            setPasswordError("Your new passwords don't match, silly!");
            return;
        }
        try {
            const { data } = await API.post('/user/change-password', passwords);
            if (data.success) {
                setPasswordSuccess('Password changed successfully! You\'re so secure now! 💖');
                setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
            } else {
                throw new Error(data.message);
            }
        } catch(err) {
            setPasswordError(err.response?.data?.message || 'Couldn\'t change your password, sowwy!');
        }
    };
    
    if (loading) return <p>Getting your fabulous profile ready...</p>;

    return (
        <>
            <div className="card">
                <h3>Your Cute Profile!</h3>
                <p>Here you can change all your important deets~</p>
                {profileError && <div className="message-area error" style={{display:'block'}}>{profileError}</div>}
                {profileSuccess && <div className="message-area success" style={{display:'block'}}>{profileSuccess}</div>}
                <form onSubmit={handleUpdateProfile}>
                     <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="firstName">First Name</label>
                            <input type="text" name="firstName" value={profile.firstName || ''} onChange={handleProfileChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="lastName">Last Name</label>
                            <input type="text" name="lastName" value={profile.lastName || ''} onChange={handleProfileChange} />
                        </div>
                         <div className="form-group full-width">
                            <label htmlFor="email">Email (can't change this, silly!)</label>
                            <input type="email" name="email" value={profile.email || ''} readOnly disabled />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary-action">Save Changes!~</button>
                </form>
            </div>
            <div className="card">
                <h3>Change Your Secret Password! 🤫</h3>
                {passwordError && <div className="message-area error" style={{display:'block'}}>{passwordError}</div>}
                {passwordSuccess && <div className="message-area success" style={{display:'block'}}>{passwordSuccess}</div>}
                <form onSubmit={handleChangePassword}>
                    <div className="form-group">
                        <label htmlFor="currentPassword">Your Old Password</label>
                        <input type="password" name="currentPassword" value={passwords.currentPassword} onChange={handlePasswordChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="newPassword">Your Sparkly New Password</label>
                        <input type="password" name="newPassword" value={passwords.newPassword} onChange={handlePasswordChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmNewPassword">Confirm It, Cutie!</label>
                        <input type="password" name="confirmNewPassword" value={passwords.confirmNewPassword} onChange={handlePasswordChange} required />
                    </div>
                    <button type="submit" className="btn btn-primary-action">Change Password</button>
                </form>
            </div>
        </>
    );
};

// --- A new Sub-component for the "Payment Methods" tab! ---
const PaymentMethods = () => {
    const [methods, setMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const fetchMethods = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await API.get('/user/payment-methods');
            if (data.success) {
                setMethods(data.paymentMethods || []);
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            setError("Couldn't get your saved cards, sowwy! >.<");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMethods();
    }, [fetchMethods]);
    
    const handleDeleteMethod = async (methodId) => {
        if (!window.confirm("Are you sure you wanna delete this card, hun?")) {
            return;
        }
        try {
            const { data } = await API.delete(`/user/payment-methods/${methodId}`);
            if (data.success) {
                fetchMethods(); // Refresh the list after deleting!
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An oopsie happened trying to delete this card!');
        }
    };
    
    if (loading) return <p>Finding your wallet...</p>;

    return (
        <>
        {isAddModalOpen && (
            <div className="modal-backdrop active">
                <div className="modal-content">
                     <div className="modal-header">
                        <h4>Add a Sparkly New Card!</h4>
                        <button type="button" className="modal-close" onClick={() => setIsAddModalOpen(false)}>&times;</button>
                    </div>
                    <div className="modal-body">
                        {/* In a real app, the Stripe CardElement would go here! */}
                        <p>This is where the super secure Stripe form would go. For now, it's just a placeholder, tee hee! ;3</p>
                    </div>
                </div>
            </div>
        )}
        <div className="card">
            <h3>Your Saved Payment Methods 💳</h3>
            <p>Here are all your cute little cards, ready for a shopping spree!</p>
            {error && <div className="message-area error" style={{display:'block'}}>{error}</div>}
            <div className="payment-methods-list">
                {methods.length > 0 ? methods.map(method => (
                    <div key={method.id} className="payment-card">
                        <span>{method.card.brand} ending in {method.card.last4}</span>
                        <span>Expires {method.card.exp_month}/{method.card.exp_year}</span>
                        <button onClick={() => handleDeleteMethod(method.id)} className="btn-delete">
                            Delete
                        </button>
                    </div>
                )) : (
                    <p>You have no saved cards yet, silly!</p>
                )}
            </div>
            <button className="btn btn-primary-action" style={{marginTop: '1rem'}} onClick={() => setIsAddModalOpen(true)}>
                Add a New Card!~
            </button>
        </div>
        </>
    );
};


// --- Main User Dashboard Page Component ---
function UserDashboardPage() {
    const [activeTab, setActiveTab] = useState('orders');

    // --- FIX: We don't need to get the CSRF token on load anymore! ---
    useEffect(() => {
        // This effect can be used for other things later if you want!
    }, []);

    const renderActiveTab = () => {
        switch(activeTab) {
            case 'orders':
                return <MyOrders />;
            case 'settings':
                return <ProfileSettings />;
            case 'payments':
                return <PaymentMethods />;
            default:
                return <MyOrders />;
        }
    };

    return (
        <div className="user-dashboard-container">
            <aside className="dashboard-sidebar">
                <h2>Hi Cutie!</h2>
                <nav>
                    <button onClick={() => setActiveTab('orders')} className={activeTab === 'orders' ? 'active' : ''}>My Orders 🛍️</button>
                    <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'active' : ''}>Profile & Settings 💖</button>
                    <button onClick={() => setActiveTab('payments')} className={activeTab === 'payments' ? 'active' : ''}>Payment Methods 💳</button>
                    <Link to="/">Back to Shopping!</Link>
                </nav>
            </aside>
            <main className="dashboard-content">
                {renderActiveTab()}
            </main>
        </div>
    );
}

export default UserDashboardPage;
