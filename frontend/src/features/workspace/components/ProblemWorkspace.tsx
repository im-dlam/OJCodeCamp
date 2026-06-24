import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProblemDetail, useProblems } from '../../../hooks/useProblems'; 
import { useCurrentUser } from '../../../hooks/useAuth'; 
import { ProblemDescription } from './ProblemDescription';
import { EditorPanel } from './EditorPanel';
import { ConsolePanel } from './ConsolePanel';
import { ChevronLeft, ChevronRight, List, Timer, UserCircle } from 'lucide-react';

import './Workspace.css';

const DEFAULT_TEMPLATES: Record<string, string> = {
  python: 'def solve():\n    # Write your code\n    pass\n\nif __name__ == "__main__":\n    solve()',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code\n    return 0;\n}',
  java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your code\n    }\n}'
};

export default function ProblemWorkspace() {
  const { endpoint } = useParams<{ endpoint: string }>();
  const navigate = useNavigate();

  const { data: detailData, isLoading, isError, error } = useProblemDetail(endpoint || "");
  const problem = detailData?.problem || null;

  const { data: user } = useCurrentUser();

  const { data: listData } = useProblems(50);
  // const problemList = listData?.data || [];
  const problemList = listData?.data 
    ? [...listData.data].sort((a, b) => a.id - b.id) 
    : [];
  
  const currentIndex = problemList.findIndex((p) => p.endpoint === endpoint);
  

  const prevProblem = currentIndex > 0 ? problemList[currentIndex - 1] : null;
  const nextProblem = currentIndex >= 0 && currentIndex < problemList.length - 1 ? problemList[currentIndex + 1] : null;

  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const [leftWidth, setLeftWidth] = useState(45); 
  const [topHeight, setTopHeight] = useState(65); 
  const [isDragging, setIsDragging] = useState(false);

  const [language, setLanguage] = useState<string>("python");
  const [codeMap, setCodeMap] = useState<Record<string, string>>(DEFAULT_TEMPLATES);
  const currentCode = codeMap[language] || "";

  const handleCodeChange = (newCode: string) => {
    setCodeMap(prev => ({ ...prev, [language]: newCode }));
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const isDraggingCol = useRef(false);
  const isDraggingRow = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingCol.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
        if (newWidth > 20 && newWidth < 80) setLeftWidth(newWidth);
      }
      if (isDraggingRow.current && rightPaneRef.current) {
        const rect = rightPaneRef.current.getBoundingClientRect();
        const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
        if (newHeight > 20 && newHeight < 80) setTopHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      isDraggingCol.current = false;
      isDraggingRow.current = false;
      setIsDragging(false); 
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto'; 
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startDragCol = () => {
    isDraggingCol.current = true;
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none'; 
  };

  const startDragRow = () => {
    isDraggingRow.current = true;
    setIsDragging(true);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  if (isError) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
        Lỗi tải bài toán: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="workspace-container">
      
      <header className="workspace-header">
        
        <div className="header-left">
          <Link to="/" className="logo-link">
            <h1 className="workspace-title">UTTCodeCamp</h1>
          </Link>
        </div>

        <div className="header-center">
          <div className="problem-nav-group">
            <button 
              className="nav-icon-btn" 
              title={prevProblem ? `Bài trước: ${prevProblem.title}` : "Không có bài trước"}
              onClick={() => prevProblem && navigate(`/problems/${prevProblem.endpoint}`)}
              disabled={!prevProblem}
              style={{ opacity: prevProblem ? 1 : 0.3, cursor: prevProblem ? 'pointer' : 'not-allowed' }}
            >
              <ChevronLeft size={18} />
            </button>
            
            <Link to="/" className="nav-list-btn" title="Danh sách bài tập">
              <List size={16} />
              <span>Problem List</span>
            </Link>
            
            <button 
              className="nav-icon-btn" 
              title={nextProblem ? `Bài tiếp theo: ${nextProblem.title}` : "Đang ở bài cuối"}
              onClick={() => nextProblem && navigate(`/problems/${nextProblem.endpoint}`)}
              disabled={!nextProblem}
              style={{ opacity: nextProblem ? 1 : 0.3, cursor: nextProblem ? 'pointer' : 'not-allowed' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="header-right">
          <div className="timer-badge" title="Thời gian giải bài">
            <Timer size={14} />
            <span className="time-text">{formatTime(seconds)}</span>
          </div>

          <div className="user-profile-badge">
            {user ? (
              <>
                <div className="user-avatar-small" title={user.full_name}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="user-name" style={{ marginLeft: '6px' }}>{user.username}</span>
              </>
            ) : (
              <>
                <UserCircle size={20} />
                <Link to="/login" style={{ color: '#d1d5db', textDecoration: 'none', marginLeft: '6px' }}>Đăng nhập</Link>
              </>
            )}
          </div>
        </div>

      </header>

      <div ref={containerRef} className="workspace-body">
        
        <div style={{ width: `${leftWidth}%`, flexShrink: 0, pointerEvents: isDragging ? 'none' : 'auto' }} className="panel-container">
          <ProblemDescription problem={problem} isLoading={isLoading} />
        </div>

        <div onMouseDown={startDragCol} className="resizer-col">
          <div className="resizer-bar" />
        </div>

        <div ref={rightPaneRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, pointerEvents: isDragging ? 'none' : 'auto' }}>
          
          <div style={{ height: `${topHeight}%`, flexShrink: 0 }} className="panel-container">
            <EditorPanel 
              code={currentCode}
              onChangeCode={handleCodeChange}
              language={language}
              onChangeLanguage={setLanguage}
            />
          </div>

          <div onMouseDown={startDragRow} className="resizer-row">
            <div className="resizer-bar" />
          </div>

          <div style={{ flex: 1, minHeight: 0 }} className="panel-container">
            <ConsolePanel 
              examples={problem?.examples} 
              problemId={problem?.id}
              currentCode={currentCode}
              language={language}
            />
          </div>

        </div>
      </div>
    </div>
  );
}