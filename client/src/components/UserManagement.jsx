import React, { useState, useEffect, useCallback } from 'react';
// --- FIX: We only need our magical API instance now! ---
import API from '../api/axios.js';
import { useAuth } from '../hooks/useAuth.jsx';

const ConfirmationModal = ({ show, onClose, onConfirm, title, children }) => {
    if (!show) return null;
    return ( <div className="modal-backdrop" style={{ display: 'flex', position: 'fixed', zIndex: 1052 }}><div className="modal-content"><div className="modal-header"><h4>{title}</h4><button onClick={onClose} className="modal-close-btn">&times;</button></div><div className="modal-body">{children}</div><div className="modal-actions"><button onClick={onClose} className="btn btn-secondary-action">Cancel</button><button onClick={onConfirm} className="btn btn-danger-action">Confirm</button></div></div></div> );
};

const UserDetailsModal = ({ show, onClose, userId }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (show && userId) {
            setLoading(true);
            API.get(`/admin/users/${userId}/details`)
                .then(res => {
                    if (res.data.success) setDetails(res.data.details);
                })
                .finally(() => setLoading(false));
        }
    }, [show, userId]);

    return (
        <div className="modal-backdrop" style={{ display: show ? 'flex' : 'none', position: 'fixed', zIndex: 1051 }}>
            <div className="modal-content">
                <div className="modal-header"><h4>User Details</h4><button onClick={onClose} className="modal-close-btn">&times;</button></div>
                <div className="modal-body">
                    {loading ? <p>Loading details...</p> : details ? (
                        <div>
                            <p><strong>ID:</strong> {details.id}</p>
                            <p><strong>Name:</strong> {details.firstName} {details.lastName}</p>
                            <p><strong>Email:</strong> {details.email}</p>
                            <p><strong>Verified:</strong> {details.isVerified ? 'Yes' : 'No'}</p>
                            <hr/>
                            <p><strong>Total Orders:</strong> {details.orderCount || 0}</p>
                            <p><strong>Total Spent:</strong> ${parseFloat(details.totalSpent || 0).toFixed(2)}</p>
                        </div>
                    ) : <p>Could not load user details.</p>}
                </div>
                <div className="modal-actions"><button onClick={onClose} className="btn btn-secondary-action">Close</button></div>
            </div>
        </div>
    );
};


function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user: currentUser } = useAuth();
    const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, user: null });
    const [detailsModalState, setDetailsModalState] = useState({ isOpen: false, userId: null });

    const fetchUsers = useCallback(async () => {
        setLoading(true); setError('');
        try { const response = await API.get('/admin/users'); setUsers(response.data.users || []); }
        catch (err) { setError(err.response?.data?.message || 'Failed to fetch users.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleToggleAdmin = async (userId) => {
        setError('');
        try {
            // --- FIX: The token is handled automatically by the interceptor! ---
            await API.put(`/admin/users/${userId}/toggle-admin`);
            fetchUsers();
        }
        catch (err) { setError(err.response?.data?.message || 'Failed to toggle admin status.'); }
    };

    const handleDeleteUser = async (userId) => {
        setDeleteModalState({ isOpen: false, user: null }); setError('');
        try {
            // --- FIX: The token is handled automatically by the interceptor! ---
            await API.delete(`/admin/users/${userId}`);
            fetchUsers();
        }
        catch (err) { setError(err.response?.data?.message || 'Failed to delete user.'); }
    };

    if (loading) return <div>Loading Users...</div>;

    return (
        <>
            <ConfirmationModal show={deleteModalState.isOpen} onClose={() => setDeleteModalState({ isOpen: false, user: null })} onConfirm={() => handleDeleteUser(deleteModalState.user.id)} title="Confirm Deletion">
                <p>Are you sure you want to delete user <strong>{deleteModalState.user?.email}</strong>?</p>
            </ConfirmationModal>
            
            <UserDetailsModal show={detailsModalState.isOpen} onClose={() => setDetailsModalState({ isOpen: false, userId: null })} userId={detailsModalState.userId} />

            <div className="card">
                <div className="card-header"><h2>User Management</h2></div>
                <div className="card-content">
                    {error && <div className="message-area error" style={{ display: 'block' }}>{error}</div>}
                    <div className="table-container">
                        <table className="admin-table">
                            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.id}</td>
                                        <td>{`${user.firstName || ''} ${user.lastName || ''}`.trim()}</td>
                                        <td>{user.email}</td>
                                        <td><span className={`badge ${user.isPrimaryAdmin ? 'primary-admin' : user.isAdmin ? 'admin' : 'user'}`}>{user.isPrimaryAdmin ? 'Primary' : user.isAdmin ? 'Admin' : 'User'}</span></td>
                                        <td>
                                            <button onClick={() => setDetailsModalState({ isOpen: true, userId: user.id })} className="btn btn-sm">Details</button>
                                            <button onClick={() => handleToggleAdmin(user.id)} className="btn btn-sm btn-secondary-action" disabled={user.isPrimaryAdmin || user.id === currentUser.id} style={{marginLeft: '8px'}}>Toggle Admin</button>
                                            <button onClick={() => setDeleteModalState({ isOpen: true, user: user })} className="btn btn-sm btn-danger-action" disabled={user.isPrimaryAdmin || user.id === currentUser.id} style={{marginLeft: '8px'}}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

export default UserManagement;
