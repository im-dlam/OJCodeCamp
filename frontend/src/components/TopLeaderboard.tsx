import React from 'react';
import { Trophy, Crown, Medal, ChevronRight } from 'lucide-react';
import { useTopLeaderBoard } from '../hooks/useAuth'; 
import { Link } from 'react-router-dom';
import './TopLeaderboard.css';

export default function TopLeaderboard() {
  const { data, isLoading, isError, error } = useTopLeaderBoard();

  if (isLoading) {
    return (
      <div className="lb-widget-container">
        <div className="lb-widget-header">
          <Trophy size={18} className="lb-icon-gold" />
          <h3>Leaderboard</h3>
        </div>
        <div className="lb-widget-body" style={{ justifyContent: 'center', padding: '30px' }}>
          <div className="lc-spinner"></div>
        </div>
      </div>
    );
  }

  if (isError || (data && !data.success)) {
    return (
      <div className="lb-widget-container">
        <p style={{ color: '#ef4444', padding: '16px', fontSize: '13px' }}>
          Lỗi tải bảng xếp hạng: {(error as Error)?.message || data?.message}
        </p>
      </div>
    );
  }

  const users = data?.leaderboard || [];

  const getRankBadge = (index: number) => {
    if (index === 0) return <Crown size={20} color="#ffb800" style={{ filter: 'drop-shadow(0 0 4px rgba(255,184,0,0.4))' }} />;
    if (index === 1) return <Medal size={18} color="#e5e7eb" style={{ filter: 'drop-shadow(0 0 2px rgba(229,231,235,0.4))' }} />;
    if (index === 2) return <Medal size={18} color="#d97706" />;
    return <span className="lb-rank-number">{index + 1}</span>;
  };

  return (
    <div className="lb-widget-container">
      <div className="lb-widget-header">
        <Trophy size={16} className="lb-icon-gold" />
        <h3>Leaderboard</h3>
      </div>

      <div className="lb-widget-body">
        {users.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#8c8c8c', fontSize: '13px' }}>
            Chưa có dữ liệu xếp hạng.
          </div>
        ) : (
          <ul className="lb-list">
            {users.slice(0, 3).map((user, index) => (
              // get top 3
              <li key={user.username} className={`lb-item ${index < 3 ? 'lb-top-3' : ''}`}>
                <div className="lb-item-left">
                  <div className="lb-rank">
                    {getRankBadge(index)}
                  </div>
                  
                  <div className="lb-avatar" title={user.full_name}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="lb-user-info">
                    <span className="lb-fullname" title={user.full_name || user.username}>{user.full_name || user.username}</span>
                    <span className="lb-username" title={`@${user.username}`}>@{user.username}</span>
                  </div>
                </div>
                
                <div className="lb-item-right">
                  <span className="lb-points">{user.point.toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="lb-widget-footer">
        <Link to="/leaderboard" className="lb-view-all">
          View full ranking <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}