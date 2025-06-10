import React, { useState, useEffect, useCallback } from 'react';
// --- FIX: We only need our magical API instance and useAuth hook now! ---
import API from '../api/axios.js';
import { useAuth } from '../hooks/useAuth.jsx';

const ConfirmationModal = ({ show, onClose, onConfirm, title, children }) => {
    if (!show) return null;
    return (
        <div className="modal-backdrop" style={{ display: 'flex', position: 'fixed', zIndex: 1052 }}><div className="modal-content">
            <div className="modal-header"><h4>{title}</h4><button onClick={onClose} className="modal-close-btn">&times;</button></div>
            <div className="modal-body">{children}</div>
            <div className="modal-actions">
                <button onClick={onClose} className="btn btn-secondary-action">Cancel</button>
                <button onClick={onConfirm} className="btn btn-danger-action">Confirm</button>
            </div>
        </div></div>
    );
};

function SettingsManagement() {
    const { user } = useAuth();
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [resetTables, setResetTables] = useState([]);
    const [isResetModalOpen, setResetModalOpen] = useState(false);

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await API.get('/admin/settings');
            if (response.data.success) {
                setSettings(response.data.settings || {});
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch site settings.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox' ? String(checked) : value;
        setSettings(prev => ({
            ...prev,
            [name]: { ...prev[name], value: finalValue }
        }));
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSuccess('');
        setError('');
        try {
            // --- FIX: The token is handled automatically by the interceptor! ---
            const response = await API.put('/admin/settings', settings);
            if (response.data.success) {
                setSuccess('Settings saved successfully!');
            }
        } catch (err) {
             setError(err.response?.data?.message || 'Failed to save settings.');
        }
    };
    
    const handleResetTableChange = (e) => {
        const { value, checked } = e.target;
        setResetTables(prev => 
            checked ? [...prev, value] : prev.filter(table => table !== value)
        );
    };

    const handleResetRequest = async () => {
        setResetModalOpen(false);
        setSuccess('');
        setError('');
        try {
            // --- FIX: The token is handled automatically by the interceptor! ---
            const response = await API.post('/admin/database/reset/request', { tables: resetTables });
            if(response.data.success) {
                setSuccess(response.data.message);
                setResetTables([]);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to request database reset.');
        }
    };

    const canViewDangerZone = settings.isPrimaryAdmin;

    if (loading) {
        return <div className="loading-spinner-container"><div className="loading-spinner"></div><p>Loading Settings...</p></div>;
    }

    return (
        <>
            <ConfirmationModal
                show={isResetModalOpen}
                onClose={() => setResetModalOpen(false)}
                onConfirm={handleResetRequest}
                title="Confirm Database Reset"
            >
                <p>This is a highly destructive action. You are requesting to permanently delete all data from the following tables:</p>
                <ul>
                    {resetTables.map(table => <li key={table}><strong>{table}</strong></li>)}
                </ul>
                <p>An email will be sent to you to confirm this action. Are you sure you want to proceed?</p>
            </ConfirmationModal>

            <div className="card">
                <div className="card-header"><h2>Site Settings</h2></div>
                <div className="card-content">
                    {error && <div className="message-area error" style={{ display: 'block' }}>{error}</div>}
                    {success && <div className="message-area success" style={{ display: 'block' }}>{success}</div>}
                    
                    <form onSubmit={handleSaveSettings}>
                        {Object.keys(settings).filter(key => key !== 'isPrimaryAdmin').map(key => (
                            <div key={key} style={{ marginBottom: '1.5rem' }}>
                                <label htmlFor={key} style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                                    {settings[key].description || key}
                                </label>
                                {key === 'maintenanceMode' ? (
                                    <label className="switch">
                                        <input type="checkbox" id={key} name={key} checked={settings[key].value === 'true'} onChange={handleInputChange} disabled={!settings.isPrimaryAdmin}/>
                                        <span className="slider round"></span>
                                    </label>
                                ) : (
                                    <input type="text" id={key} name={key} value={settings[key].value || ''} onChange={handleInputChange} disabled={!settings.isPrimaryAdmin} />
                                )}
                            </div>
                        ))}

                        <div style={{marginTop: 'var(--spacing-lg)'}}>
                            <button type="submit" className="btn" disabled={!settings.isPrimaryAdmin}>Save Settings</button>
                            {!settings.isPrimaryAdmin && <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem'}}>Only the primary admin can modify these settings.</p>}
                        </div>
                    </form>

                    {canViewDangerZone && (
                        <div className="danger-zone" style={{borderTop: '2px solid var(--accent-red)', marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-lg)'}}>
                            <h3 style={{color: 'var(--accent-red)'}}>Danger Zone</h3>
                            <p>These actions are destructive and cannot be undone without confirmation.</p>
                            
                            <div>
                                <h4>Request Database Table Reset</h4>
                                <p>Select tables to reset:</p>
                                <div>
                                    <label><input type="checkbox" name="tables" value="users" onChange={handleResetTableChange} checked={resetTables.includes('users')} /> Users</label>
                                    <label style={{marginLeft: '1rem'}}><input type="checkbox" name="tables" value="products" onChange={handleResetTableChange} checked={resetTables.includes('products')} /> Products</label>
                                    <label style={{marginLeft: '1rem'}}><input type="checkbox" name="tables" value="orders" onChange={handleResetTableChange} checked={resetTables.includes('orders')} /> Orders</label>
                                </div>
                                <div style={{marginTop: 'var(--spacing-md)'}}>
                                    <button onClick={() => setResetModalOpen(true)} className="btn btn-danger-action" disabled={resetTables.length === 0}>Request Reset</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default SettingsManagement;
