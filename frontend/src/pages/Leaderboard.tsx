import React from 'react';
import Navbar from '../components/Navbar';
import { useTopLeaderBoard } from '../hooks/useAuth';
import { Trophy, Crown, Medal } from 'lucide-react';
import './Leaderboard.css';

export default function Leaderboard() {
  const { data, isLoading, isError, error } = useTopLeaderBoard();

  if (isLoading) {
    return (
      <div className="lbp-layout">
        <Navbar />
        <div className="lc-center-msg"><div className="lc-spinner"></div></div>
      </div>
    );
  }

  if (isError || (data && !data.success)) {
    return (
      <div className="lbp-layout">
        <Navbar />
        <div className="lc-center-msg" style={{ color: '#ef4444' }}>
          Lỗi tải bảng xếp hạng: {(error as Error)?.message || data?.message}
        </div>
      </div>
    );
  }

  const users = data?.leaderboard || [];

  const getRankBadge = (index: number) => {
    if (index === 0) return <Crown size={24} color="#eab308" />; 
    if (index === 1) return <Medal size={22} color="#94a3b8" />; 
    if (index === 2) return <Medal size={22} color="#d97706" />; 
    return <span className="lbp-rank-number">{index + 1}</span>;
  };

  return (
    <div className="lbp-layout">
      <Navbar />
      
      <main className="lbp-container">
        <div className="lbp-header">
          <Trophy size={36} className="lbp-main-icon" />
          <h1 className="lbp-title">Global Ranking</h1>
          <p className="lbp-subtitle">Top LeaderBoard</p>
        </div>

        <div className="lbp-card">
          <div className="lbp-card-header">
            <div className="col-rank">Rank</div>
            <div className="col-user">Programmer</div>
            <div className="col-score">Score</div>
          </div>

          {users.length === 0 ? (
            <div className="lbp-empty">Chưa có dữ liệu xếp hạng.</div>
          ) : (
            <ul className="lbp-list">
              {users.map((user, index) => (
                <li key={user.username} className={`lbp-item rank-${index + 1}`}>
                  
                  <div className="lbp-item-left">
                    <div className="lbp-rank">
                      {getRankBadge(index)}
                    </div>
                    
                    <div className="lbp-avatar" title={user.full_name}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="lbp-user-info">
                      <span className="lbp-fullname">{user.full_name || user.username}</span>
                      <span className="lbp-username">@{user.username}</span>
                    </div>
                  </div>
                  
                  <div className="lbp-item-right">
                    <span className="lbp-points">{user.point.toLocaleString()}</span>
                  </div>
                  
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}