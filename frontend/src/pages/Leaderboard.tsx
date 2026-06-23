import React from 'react';
import Navbar from '../components/Navbar';
import { useTopLeaderBoard } from '../hooks/useAuth';
import { Trophy } from 'lucide-react';
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

  return (
    <div className="lbp-layout">
      <Navbar />
      
      <main className="lbp-container">
        <div className="lbp-header">
          <Trophy size={36} className="lbp-main-icon" />
          <h1 className="lbp-title">Global Ranking</h1>
          <p className="lbp-subtitle">Top CodeCamp Leaderboard</p>
        </div>

        <div className="lbp-card">
          <div className="lbp-card-header">
            <div className="col-rank">#</div>
            <div className="col-user">Programmer</div>
            <div className="col-score">Score</div>
          </div>

          {users.length === 0 ? (
            <div className="lbp-empty">Chưa có dữ liệu xếp hạng.</div>
          ) : (
            <ul className="lbp-list">
              {users.map((user, index) => (
                <li key={user.username} className="lbp-item">
                  
                  <div className="lbp-item-left">
                    {/* fix: hiển thị thẳng Số Thứ Tự (Index) thay vì icon màu mè */}
                    <div className="lbp-rank" title={`Hạng ${index + 1}`}>
                      <span className={`lbp-rank-number ${index < 3 ? `top-${index + 1}` : ''}`}>
                        {index + 1}
                      </span>
                    </div>
                    
                    {/* fix: Avatar hình tròn màu solid cơ bản, không dùng gradient */}
                    <div className="lbp-avatar" title={user.full_name}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="lbp-user-info">
                      <span className="lbp-fullname" title={user.full_name || user.username}>{user.full_name || user.username}</span>
                      <span className="lbp-username" title={`@${user.username}`}>@{user.username}</span>
                    </div>
                  </div>
                  
                  <div className="lbp-item-right">
                    <span className="lbp-points" title={`${user.point.toLocaleString()} điểm`}>{user.point.toLocaleString()}</span>
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