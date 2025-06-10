import React, { useState, useEffect } from 'react';
// --- FIX: Re-added file extensions to imports to resolve build errors ---
import { useAuth } from '../hooks/useAuth.jsx';
import API from '../api/axios.js';

// Admin Panel Components
import UserManagement from '../components/UserManagement.jsx';
import ProductManagement from '../components/ProductManagement.jsx';
import OrderManagement from '../components/OrderManagement.jsx';
import ChatManagement from '../components/ChatManagement.jsx';
import SettingsManagement from '../components/SettingsManagement.jsx';
import IpManagement from '../components/IpManagement.jsx';
import AdminChat from '../components/AdminChat.jsx';


const RecentActivity = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get('/admin/dashboard/activity')
            .then(res => {
                if (res.data.success) {
                    setActivities(res.data.activities || []);
                }
            })
            .catch(err => console.error("Failed to fetch recent activity:", err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p>Loading activity...</p>;

    return (
        <div className="card">
            <div className="card-header"><h4>Recent Activity</h4></div>
            <div className="card-content">
                <ul className="activity-feed">
                    {activities.length > 0 ? activities.map((item, index) => (
                        <li key={index}>
                            <span className="activity-icon">{/* Placeholder for icon */}</span>
                            <div className="activity-details">
                                <strong>{item.type}</strong>: {item.details}
                                <span className="activity-timestamp">{new Date(item.timestamp).toLocaleString()}</span>
                            </div>
                        </li>
                    )) : (
                        <p>No recent activity to display.</p>
                    )}
                </ul>
            </div>
        </div>
    );
};


const DashboardHome = () => {
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        API.get('/admin/dashboard/stats')
            .then(res => {
                if (res.data) setStats(res.data.stats || res.data);
            })
            .catch(() => setError('Failed to fetch dashboard stats.'))
            .finally(() => setLoading(false));
    }, []);

    const StatCard = ({ title, value, icon }) => (
        <div className="card stat-card">
            <div className="stat-icon"><i className={icon}></i></div>
            <div><h3>{title}</h3><p className="stat-value">{loading ? '...' : (value || 0)}</p></div>
        </div>
    );

    return (
        <>
            <div className="card"><div className="card-header"><h2>Dashboard</h2></div>
                <div className="card-content">
                    {error && <div className="message-area error" style={{display: 'block'}}>{error}</div>}
                    <div className="stats-grid">
                        <StatCard title="Total Users" value={stats.totalUsers} icon="fas fa-users" />
                        <StatCard title="Total Products" value={stats.totalProducts} icon="fas fa-box" />
                        <StatCard title="Total Orders" value={stats.totalOrders} icon="fas fa-receipt" />
                        <StatCard title="Total Revenue" value={stats.totalRevenue ? `$${parseFloat(stats.totalRevenue).toFixed(2)}` : '$0.00'} icon="fas fa-dollar-sign" />
                    </div>
                </div>
            </div>
            <RecentActivity />
        </>
    );
};


function AdminDashboardPage() {
    const [activeTab, setActiveTab] = useState('dashboard-home');
    const { logout } = useAuth();

    useEffect(() => {
        document.body.classList.add('dashboard');
        return () => document.body.classList.remove('dashboard');
    }, []);

    const renderActiveTab = () => {
        switch(activeTab) {
            case 'dashboard-home': return <DashboardHome />;
            case 'user-management': return <UserManagement />;
            case 'product-management': return <ProductManagement />;
            case 'order-management': return <OrderManagement />;
            case 'chat-management': return <ChatManagement />;
            case 'settings-management': return <SettingsManagement />;
            case 'ip-management': return <IpManagement />;
            default: return <DashboardHome />;
        }
    };

    const NavButton = ({ tabId, icon, children }) => (
        <a href="#" className={`nav-link ${activeTab === tabId ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab(tabId); }}>
            <i className={`${icon} nav-icon`}></i><span>{children}</span>
        </a>
    );

    return (
        <>
            <style>{`
                .activity-feed { list-style: none; padding: 0; margin: 0; }
                .activity-feed li { display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--card-border); }
                .activity-icon { font-size: 20px; margin-right: 15px; width: 30px; text-align: center; }
                .activity-details, .chat-message { display: flex; flex-direction: column; }
                .activity-timestamp, .msg-timestamp { font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px; }
                
                .admin-chat-widget-container { position: fixed; bottom: 20px; right: 20px; z-index: 1100; }
                .chat-toggle-button { background: var(--gradient-accent); color: white; border: none; border-radius: 50%; width: 60px; height: 60px; font-size: 24px; display: flex; justify-content: center; align-items: center; box-shadow: var(--shadow-lg); cursor: pointer; transition: transform 0.2s ease; }
                .chat-toggle-button:hover { transform: scale(1.1); }
                .floating-chat-panel { position: absolute; bottom: 80px; right: 0; width: 350px; height: 450px; max-width: 90vw; box-shadow: var(--shadow-xl); border-radius: var(--radius-lg); background: var(--card-bg); display: flex; flex-direction: column; border: 1px solid var(--card-border); }
                .chat-panel-header { padding: 1rem; border-bottom: 1px solid var(--card-border); display: flex; justify-content: space-between; align-items: center; }
                .chat-panel-header h3 { margin: 0; }
                .chat-messages-area { flex-grow: 1; overflow-y: auto; padding: 1rem; }
                .chat-message.other-admin { background-color: var(--background-color); padding: 8px; border-radius: 8px; margin-bottom: 8px; }
                .chat-message.current-admin { background-color: var(--accent-blue-light); padding: 8px; border-radius: 8px; margin-bottom: 8px; }
                .chat-input-area { border-top: 1px solid var(--card-border); padding: 1rem; }
                .chat-input-area form { display: flex; gap: 0.5rem; }
                .chat-input-area input { flex-grow: 1; }
            `}</style>

            <div className="dashboard-container">
                <aside className="dashboard-sidebar">
                    <div className="sidebar-header"><h1 className="gradient-text">RealmMaid</h1></div>
                    <nav className="sidebar-nav">
                        <NavButton tabId="dashboard-home" icon="fas fa-tachometer-alt">Dashboard</NavButton>
                        <NavButton tabId="user-management" icon="fas fa-users-cog">Users</NavButton>
                        <NavButton tabId="product-management" icon="fas fa-boxes-stacked">Products</NavButton>
                        <NavButton tabId="order-management" icon="fas fa-receipt">Orders</NavButton>
                        <NavButton tabId="chat-management" icon="fas fa-comments">Chats</NavButton>
                        <NavButton tabId="settings-management" icon="fas fa-cogs">Settings</NavButton>
                        <NavButton tabId="ip-management" icon="fas fa-shield-alt">IP Manager</NavButton>
                    </nav>
                    <div className="sidebar-footer"><button onClick={logout} className="btn btn-danger-action" style={{width: '100%'}}>Logout</button></div>
                </aside>
                <main className="dashboard-main"><div className="tab-content active">{renderActiveTab()}</div></main>
            </div>
            
            <AdminChat />
        </>
    );
}

export default AdminDashboardPage;
