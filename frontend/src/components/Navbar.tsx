import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrentUser, useLogout } from '../hooks/useAuth';
import './Navbar.css';

export default function Navbar() {
  const { data: user, isLoading } = useCurrentUser();
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => navigate('/login')
    });
  };

  return (
    <nav className="navbar-container">
      <div className="nav-left">
        <Link to="/" className="nav-logo">
          UTT<span>CodeCamp</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-item active">Problems</Link>
          <Link to="/contests" className="nav-item">Contests</Link>
          <Link to="/leaderboard" className="nav-item">Leaderboard</Link>
        </div>
      </div>

      <div className="nav-right">
        {isLoading ? (
          <div style={{ color: '#9ca3af', fontSize: '14px' }}>Loading...</div>
        ) : user ? (
          <div className="user-menu">
            <div className="user-point">⭐ {user.point}</div>
            <div className="user-avatar" title={user.full_name}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <button onClick={handleLogout} className="btn-logout">Đăng xuất</button>
          </div>
        ) : (
          <>
            <Link to="/login" className="nav-btn-login">Đăng nhập</Link>
            <Link to="/signup" className="nav-btn-signup">Đăng ký</Link>
          </>
        )}
      </div>
    </nav>
  );
}