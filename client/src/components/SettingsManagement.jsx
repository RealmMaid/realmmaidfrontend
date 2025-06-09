import React, { useState, useEffect, useCallback } from 'react';

// --- Real Dependencies ---
// Correctly import the configured API instance, the CSRF token helper, and the auth hook.
import API, { getCsrfToken } from '../api/axios.js';
import { useAuth } from '../hooks/useAuth.jsx';

/**
 * A reusable modal component for confirming actions.
 */
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
    const { user } = useAuth(); // Get the current user
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // State specifically for the database reset form
    const [resetTables, setResetTables] = useState([]);
    const [isResetModalOpen, setResetModalOpen] = useState(false);

    // Fetches the current site settings from the backend.
    const fetchSettings = useCallback(async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            // API call to GET /api/admin/settings from adminRoutes.js
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

    // Handles changes to form inputs.
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        // The backend expects boolean values as strings "true" or "false"
        const finalValue = type === 'checkbox' ? String(checked) : value;
        setSettings(prev => ({
            ...prev,
            [name]: { ...prev[name], value: finalValue }
        }));
    };

    // Saves the updated settings to the backend.
    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSuccess('');
        setError('');
        try {
            const token = await getCsrfToken();
            // API call to PUT /api/admin/settings, now with the token included
            const response = await API.put('/admin/settings', { ...settings, _csrf: token });
            if (response.data.success) {
                setSuccess('Settings saved successfully!');
            }
        } catch (err) {
             setError(err.response?.data?.message || 'Failed to save settings.');
        }
    };
    
    // Handles toggling which database tables are selected for reset.
    const handleResetTableChange = (e) => {
        const { value, checked } = e.target;
        setResetTables(prev => 
            checked ? [...prev, value] : prev.filter(table => table !== value)
        );
    };

    // Submits the database reset request to the backend.
    const handleResetRequest = async () => {
        setResetModalOpen(false); // Close the modal first
        setSuccess('');
        setError('');
        try {
            const token = await getCsrfToken();
            // API call to POST /api/admin/database/reset/request, now with the token included
            const response = await API.post('/admin/database/reset/request', { tables: resetTables, _csrf: token });
            if(response.data.success) {
                setSuccess(response.data.message);
                setResetTables([]); // Clear selections on success
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to request database reset.');
        }
    };

    // --- FIX: The check for the Danger Zone now ONLY relies on the 'isPrimaryAdmin' flag ---
    // The backend is the source of truth for this permission.
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

                    {/* This will now correctly render for any user the backend designates as the primary admin */}
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
