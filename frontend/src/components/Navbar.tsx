// file: Navbar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCurrentUser, useLogout } from '../hooks/useAuth';
import { TerminalSquare, Flame, LogOut, User } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { data: user, isLoading } = useCurrentUser();
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  
  // feature: Quản lý trạng thái đóng/mở của User Dropdown Menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => navigate('/login')
    });
  };

  const isActive = (path: string) => location.pathname === path;

  // feature: Tự động đóng menu khi click ra ngoài (Outside Click Detection)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar-container">
      <div className="nav-left">
        <Link to="/" className="nav-logo">
          <TerminalSquare size={24} className="logo-icon" />
          <span className="logo-text">UTT<span className="logo-accent">CodeCamp</span></span>
        </Link>
        <div className="nav-links">
          <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>Problems</Link>
          <Link to="/contests" className={`nav-item ${isActive('/contests') ? 'active' : ''}`}>Contests</Link>
          <Link to="/leaderboard" className={`nav-item ${isActive('/leaderboard') ? 'active' : ''}`}>Leaderboard</Link>
        </div>
      </div>

      <div className="nav-right">
        {isLoading ? (
          <div className="nav-skeleton-loader"></div>
        ) : user ? (
          <div className="user-menu" ref={dropdownRef}>
            
            {/* ui: Icon ngọn lửa chuẩn style LeetCode streak */}
            <div className="user-point" title="Tổng điểm">
              <Flame size={18} className="point-icon-flame" />
              <span>{user.point.toLocaleString()}</span>
            </div>
            
            <div 
              className="user-avatar" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              title="Tài khoản"
            >
              {user.username.charAt(0).toUpperCase()}
            </div>

            {/* feature: Dropdown menu hiện ra khi click vào avatar */}
            {isMenuOpen && (
              <div className="user-dropdown-menu">
                <div className="dropdown-header">
                  <p className="dropdown-name">{user.full_name || user.username}</p>
                  <p className="dropdown-username">@{user.username}</p>
                </div>
                <div className="dropdown-divider"></div>
                <Link to="/profile" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                  <User size={16} /> Hồ sơ cá nhân
                </Link>
                <button onClick={handleLogout} className="dropdown-item text-danger">
                  <LogOut size={16} /> Đăng xuất
                </button>
              </div>
            )}
            
          </div>
        ) : (
          <div className="auth-actions">
            <Link to="/login" className="nav-btn-login">Đăng nhập</Link>
            <Link to="/signup" className="nav-btn-signup">Đăng ký</Link>
          </div>
        )}
      </div>
    </nav>
  );
}