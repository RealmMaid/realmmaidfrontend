import React, { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios';

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

export default PaymentMethods;