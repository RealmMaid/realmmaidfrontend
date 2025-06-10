import React, { useState, useEffect, useCallback } from 'react';

// --- Mock API for self-contained functionality ---
// In your actual project, this will be correctly imported from '../api/axios.js'
const API = {
  get: async (url) => {
    console.log(`Mock API GET: ${url}`);
    // Simulate a successful response with mock data
    if (url === '/admin/dashboard/stats') {
      return { data: { success: true, stats: { totalUsers: 13, totalProducts: 42, totalOrders: 137, totalRevenue: '2456.78' } } };
    }
    if (url === '/admin/dashboard/activity') {
        return { data: { success: true, activities: [{type: "New User", details: "A new user has registered.", timestamp: new Date().toISOString()}] } };
    }
    return { data: { success: false, message: 'Endpoint not mocked' } };
  },
};


// A reusable component for a single statistic card.
const StatCard = ({ title, value, icon, loading }) => (
  <div className="card stat-card">
    <div className="stat-card-icon">{icon}</div>
    <div className="stat-card-info">
      <h4>{title}</h4>
      <p className="stat-value">{loading ? '...' : value}</p>
    </div>
  </div>
);

function DashboardHome() {
  const [stats, setStats] = useState({});
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch stats and activities in parallel using the correct API instance and endpoints
      const [statsResponse, activityResponse] = await Promise.all([
        API.get('/admin/dashboard/stats'),
        API.get('/admin/dashboard/activity')
      ]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats || {});
      } else {
        throw new Error(statsResponse.data.message || 'Failed to fetch dashboard stats.');
      }

      if (activityResponse.data.success) {
        setActivities(activityResponse.data.activities || []);
      } else {
        throw new Error(activityResponse.data.message || 'Failed to fetch recent activity.');
      }

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred while fetching dashboard data.');
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Use Font Awesome icons for the stat cards
  return (
    <div className="card">
        <div className="card-header">
            <h2>Dashboard</h2>
        </div>
        <div className="card-content">
            {error && <div className="message-area error" style={{display: 'block'}}>{error}</div>}
            
            <div className="stats-grid">
                <StatCard title="Total Users" value={stats.totalUsers} icon={<i className="fas fa-users"></i>} loading={loading} />
                <StatCard title="Total Products" value={stats.totalProducts} icon={<i className="fas fa-box"></i>} loading={loading} />
                <StatCard title="Total Orders" value={stats.totalOrders} icon={<i className="fas fa-receipt"></i>} loading={loading} />
                <StatCard title="Total Revenue" value={stats.totalRevenue ? `$${parseFloat(stats.totalRevenue).toFixed(2)}` : '$0.00'} icon={<i className="fas fa-dollar-sign"></i>} loading={loading} />
            </div>

            <div style={{marginTop: 'var(--spacing-xl)'}}>
                <h3>Recent Activity</h3>
                <div className="card">
                    <ul className="activity-feed" style={{listStyle: 'none', padding: 0}}>
                        {loading ? (
                            <li style={{padding: 'var(--spacing-md)'}}>Loading activity...</li>
                        ) : activities.length > 0 ? (
                            activities.map((activity, index) => (
                                <li key={index} style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', padding: 'var(--spacing-sm) 0', borderBottom: '1px solid var(--card-border)'}}>
                                    <span style={{fontSize: '1.2rem', color: 'var(--accent-teal)'}}><i className={activity.icon || 'fas fa-history'}></i></span>
                                    <span style={{flex: 1}}>
                                        <strong>{activity.type}:</strong> {activity.details}
                                    </span>
                                    <span style={{color: 'var(--text-secondary)', fontSize: '0.8rem'}}>
                                        {new Date(activity.timestamp).toLocaleString()}
                                    </span>
                                </li>
                            ))
                        ) : (
                            <li style={{padding: 'var(--spacing-md)', textAlign: 'center'}}>No recent activity to display.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    </div>
  );
}

export default DashboardHome;
