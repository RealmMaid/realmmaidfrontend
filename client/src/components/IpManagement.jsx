import React, { useState, useEffect, useCallback } from 'react';

// --- Real Dependencies ---
// Correctly import the API instance and the CSRF helper.
import API, { getCsrfToken } from '../api/axios.js';

/**
 * A reusable modal component for confirming destructive actions.
 */
const ConfirmationModal = ({ show, onClose, onConfirm, title, children }) => {
    if (!show) return null;
    return (
        <div className="modal-backdrop" style={{ display: 'flex', position: 'fixed', zIndex: 1052 }}>
            <div className="modal-content">
                <div className="modal-header"><h4>{title}</h4><button onClick={onClose} className="modal-close-btn">&times;</button></div>
                <div className="modal-body">{children}</div>
                <div className="modal-actions">
                    <button onClick={onClose} className="btn btn-secondary-action">Cancel</button>
                    <button onClick={onConfirm} className="btn btn-danger-action">Confirm</button>
                </div>
            </div>
        </div>
    );
};


/**
 * Renders the IP Management tab, now with CSRF protection for blocking/unblocking IPs.
 */
function IpManagement() {
    const [blacklist, setBlacklist] = useState([]);
    const [ipLogs, setIpLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [ipToBlock, setIpToBlock] = useState('');
    const [reason, setReason] = useState('');

    // State for managing confirmation modals
    const [modalState, setModalState] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });

    // Fetches all necessary IP-related data from the backend in parallel.
    const fetchIpData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [blacklistRes, logsRes] = await Promise.all([
                API.get('/admin/ip/blacklist'), // GET /api/admin/ip/blacklist
                API.get('/admin/ip/logs')       // GET /api/admin/ip/logs
            ]);

            if (blacklistRes.data.success) setBlacklist(blacklistRes.data.blacklist || []);
            if (logsRes.data.success) setIpLogs(logsRes.data.logs || []);

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch IP data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchIpData();
    }, [fetchIpData]);
    
    // Submits the form to add a new IP to the blacklist.
    const handleBlockSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // --- FIX: Fetch the CSRF token before the request ---
            const token = await getCsrfToken();
            // POST /api/admin/ip/blacklist
            await API.post('/admin/ip/blacklist', { ipAddress: ipToBlock, reason, _csrf: token });
            
            setIpToBlock('');
            setReason('');
            fetchIpData(); // Refresh all data after blocking
        } catch(err) {
            setError(err.response?.data?.message || 'Failed to block IP address.');
        }
    };
    
    // Removes an IP from the blacklist after confirmation from the modal.
    const handleUnblockIp = async (ip) => {
        closeModal();
        setError('');
        try {
            // --- FIX: Fetch the CSRF token before the request ---
            const token = await getCsrfToken();
            // DELETE /api/admin/ip/blacklist/:ipAddress
            await API.delete(`/admin/ip/blacklist/${encodeURIComponent(ip)}`, { data: { _csrf: token } });
            fetchIpData(); // Refresh all data
        } catch(err) {
            setError(err.response?.data?.message || 'Failed to unblock IP address.');
        }
    };

    // --- Modal helpers ---
    const openConfirmModal = (ip) => {
        setModalState({
            isOpen: true,
            onConfirm: () => handleUnblockIp(ip),
            title: 'Confirm Unblock',
            message: `Are you sure you want to unblock the IP address: ${ip}? This will allow it to access the site again.`
        });
    };
    const closeModal = () => setModalState({ isOpen: false, onConfirm: null, title: '', message: '' });


    if (loading) {
        return <div className="loading-spinner-container"><div className="loading-spinner"></div><p>Loading IP Data...</p></div>;
    }

    return (
        <>
            <ConfirmationModal 
                show={modalState.isOpen}
                onClose={closeModal}
                onConfirm={modalState.onConfirm}
                title={modalState.title}
            >
                <p>{modalState.message}</p>
            </ConfirmationModal>

            <div className="card">
                <div className="card-header"><h2>IP Security Management</h2></div>
                <div className="card-content">
                    {error && <div className="message-area error" style={{display: 'block'}}>{error}</div>}

                    <form onSubmit={handleBlockSubmit} style={{marginBottom: '2rem', padding: '1rem', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)'}}>
                        <h4>Add IP to Blacklist</h4>
                        <div style={{display: 'flex', gap: '1rem', alignItems: 'flex-end'}}>
                            <div style={{flexGrow: 1}}><label>IP Address</label><input type="text" value={ipToBlock} onChange={e => setIpToBlock(e.target.value)} placeholder="e.g., 192.168.1.1" required /></div>
                            <div style={{flexGrow: 1}}><label>Reason (Optional)</label><input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Spam activity" /></div>
                            <button type="submit" className="btn btn-danger-action">Block IP</button>
                        </div>
                    </form>

                    <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-lg)'}}>
                        <div>
                            <h4>Blacklisted IPs</h4>
                            <div className="table-container"><table className="admin-table">
                                <thead><tr><th>IP Address</th><th>Reason</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {blacklist.length > 0 ? blacklist.map(ip => <tr key={ip.ip_address}><td>{ip.ip_address}</td><td>{ip.reason || 'N/A'}</td><td><button onClick={() => openConfirmModal(ip.ip_address)} className="btn btn-sm">Unblock</button></td></tr>)
                                    : (<tr><td colSpan="3" style={{textAlign: 'center', padding: '1rem'}}>The blacklist is empty.</td></tr>)}
                                </tbody>
                            </table></div>
                        </div>
                        <div>
                            <h4>Recent IP Logs</h4>
                            <div className="table-container"><table className="admin-table">
                                <thead><tr><th>IP</th><th>Endpoint</th><th>Status</th><th>User</th><th>Timestamp</th></tr></thead>
                                <tbody>
                                    {ipLogs.length > 0 ? ipLogs.map(log => <tr key={log.id}>
                                        <td>{log.ip_address}</td>
                                        <td title={log.url} style={{maxWidth: '250px', whiteSpace:'nowrap', overflow: 'hidden', textOverflow:'ellipsis'}}>{log.method} {log.url}</td>
                                        <td>{log.status_code}</td>
                                        <td>{log.user_email || 'Guest'}</td>
                                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                                    </tr>)
                                    : (<tr><td colSpan="5" style={{textAlign: 'center', padding: '1rem'}}>No recent IP logs found.</td></tr>)}
                                </tbody>
                            </table></div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default IpManagement;
