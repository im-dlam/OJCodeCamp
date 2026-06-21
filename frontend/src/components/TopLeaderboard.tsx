import { Flame, Sparkles, Zap, ChevronRight, Activity } from 'lucide-react';
import { useTopLeaderBoard } from '../hooks/useAuth'; 
import { Link } from 'react-router-dom';
import './TopLeaderboard.css';

export default function TopLeaderboard() {
  const { data, isLoading, isError, error } = useTopLeaderBoard();

  if (isLoading) {
    return (
      <div className="lb-compact-widget">
        <div className="lb-compact-header">
          <Activity size={16} className="lb-icon-pulse" />
          <h3>Top Rank</h3>
        </div>
        <div className="lb-compact-body lb-loading">
          <div className="lc-spinner"></div>
        </div>
      </div>
    );
  }

  if (isError || (data && !data.success)) {
    return (
      <div className="lb-compact-widget">
        <p className="lb-error-text">
          Lỗi: {(error as Error)?.message || data?.message}
        </p>
      </div>
    );
  }

  const users = data?.leaderboard || [];

  const getRankBadge = (index: number) => {
    if (index === 0) return <Flame size={16} className="rank-icon-1" />;
    if (index === 1) return <Sparkles size={14} className="rank-icon-2" />;
    if (index === 2) return <Zap size={14} className="rank-icon-3" />;
    return <span className="lb-rank-num">{index + 1}</span>;
  };

  return (
    <div className="lb-compact-widget">
      <div className="lb-compact-header">
        <Activity size={16} className="lb-icon-pulse" />
        <h3>Top Rank</h3>
      </div>

      <div className="lb-compact-body">
        {users.length === 0 ? (
          <div className="lb-empty-text">Chưa có dữ liệu</div>
        ) : (
          <div className="lb-scroll-container">
            <ul className="lb-compact-list">
              {users.slice(0, 5).map((user, index) => (
                <li key={user.username} className="lb-compact-item">
                  <div className="lb-item-left">
                    <div className="lb-rank-box" title={`Hạng ${index + 1}`}>
                      {getRankBadge(index)}
                    </div>
                    
                    <div className={`lb-tiny-avatar rank-bg-${index}`} title={user.full_name}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="lb-user-meta">
                      <span className="lb-user-name" title={`Người chơi: ${user.full_name || user.username}`}>
                        {user.full_name || user.username}
                      </span>
                    </div>
                  </div>
                  
                  <div className="lb-item-right">
                    <span className="lb-user-pts" title={`Tổng điểm: ${user.point.toLocaleString()}`}>
                      {user.point.toLocaleString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="lb-compact-footer">
        <Link to="/leaderboard" className="lb-view-link" title="Mở bảng xếp hạng đầy đủ">
          View All <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}