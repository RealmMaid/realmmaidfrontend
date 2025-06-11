import React, { useState, useEffect } from 'react';
import API from '../../api/axios';

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

export default ProfileSettings;