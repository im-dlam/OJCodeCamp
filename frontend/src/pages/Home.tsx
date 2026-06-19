import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useProblems } from "../hooks/useProblems";
import Navbar from "../components/Navbar";
import TopLeaderboard from '../components/TopLeaderboard';
import { 
  Search, SlidersHorizontal, ArrowUpDown, Shuffle,
  Check, Circle, LayoutGrid, Code, Database, Terminal, Cpu,
  ChevronLeft, ChevronRight
} from "lucide-react";
import "./Home.css";

export default function Home() {
  const { data, isLoading, isError, error } = useProblems(50);
  
  const [activeTag, setActiveTag] = useState("All Topics");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc"); 

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOrder, activeTag]);

  const problems = data?.data || [];
  const totalFromAPI = data?.total || 0;
  const currentCountFromAPI = data?.current_count || problems.length;
  const hasNextFromAPI = data?.has_next || false;

  const displayedProblems = useMemo(() => {
    let result = [...problems];

    if (searchTerm.trim() !== "") {
      result = result.filter(prob => 
        prob.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    result.sort((a, b) => {
      return sortOrder === "asc" ? a.id - b.id : b.id - a.id;
    });

    return result;
  }, [problems, searchTerm, sortOrder, activeTag]);

  const totalPages = Math.ceil(displayedProblems.length / itemsPerPage);
  const currentData = displayedProblems.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (isLoading) {
    return (
      <div className="lc-layout">
        <Navbar />
        <div className="lc-center-msg"><div className="lc-spinner"></div></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="lc-layout">
        <Navbar />
        <div className="lc-center-msg" style={{ color: '#ef4444' }}>
          Lỗi: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className="lc-layout">
      <Navbar />
      
      {/* VÙNG CHỨA RELATIVE: Trở thành tọa độ gốc để gắn các thành phần */}
      <div style={{ position: 'relative', width: '100%', minHeight: 'calc(100vh - 64px)' }}>
        
        {/* ================= 1. BẢNG PROBLEMS (CĂN GIỮA TUYỆT ĐỐI) ================= */}
        {/* Dùng margin: 0 auto nên nó vĩnh viễn ở tâm màn hình, bỏ mặc Leaderboard */}
        <main style={{ 
          maxWidth: '1150px', // Rộng, to và dài ra theo đúng ý bạn
          width: '100%',
          margin: '32px auto', // KHÓA CHẾT Ở TRUNG TÂM
          padding: '0 24px',
          paddingBottom: '64px',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px' 
        }}>
          
          <div className="lc-tags-scroll">
            <div className="lc-tags-container">
              <button className={`lc-tag-btn ${activeTag === "All Topics" ? "active" : ""}`} onClick={() => setActiveTag("All Topics")}>
                <LayoutGrid size={14} /> All Topics
              </button>
              <button className={`lc-tag-btn ${activeTag === "Algorithms" ? "active" : ""}`} onClick={() => setActiveTag("Algorithms")}>
                <Code size={14} className="tag-icon-algo" /> Algorithms
              </button>
              <button className={`lc-tag-btn ${activeTag === "Database" ? "active" : ""}`} onClick={() => setActiveTag("Database")}>
                <Database size={14} className="tag-icon-db" /> Database
              </button>
              <button className={`lc-tag-btn ${activeTag === "Shell" ? "active" : ""}`} onClick={() => setActiveTag("Shell")}>
                <Terminal size={14} className="tag-icon-shell" /> Shell
              </button>
              <button className={`lc-tag-btn ${activeTag === "Concurrency" ? "active" : ""}`} onClick={() => setActiveTag("Concurrency")}>
                <Cpu size={14} className="tag-icon-cpu" /> Concurrency
              </button>
            </div>
          </div>

          <div className="lc-toolbar">
            <div className="lc-toolbar-left">
              <div className="lc-search-box">
                <Search size={16} className="lc-search-icon" />
                <input 
                  type="text" 
                  placeholder="Search questions" 
                  className="lc-search-input" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                className={`lc-icon-btn ${sortOrder === 'desc' ? 'active-sort' : ''}`} 
                onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                title="Sắp xếp tăng/giảm dần"
              >
                <ArrowUpDown size={16} />
              </button>
              <button className="lc-icon-btn"><SlidersHorizontal size={16} /></button>
            </div>
            
            <div className="lc-toolbar-right">
              <div className="lc-progress-text" style={{ display: 'flex', alignItems: 'center', color: '#bfbfbf', fontSize: '14px' }}>
                <Database size={14} color="#3b82f6" style={{ marginRight: '6px' }} /> 
                {currentCountFromAPI} / {totalFromAPI} problem
              </div>
              <button className="lc-icon-btn"><Shuffle size={16} color="#3b82f6" /></button>
            </div>
          </div>

          <div className="lc-list-container">
            <div className="lc-row lc-header">
              <div className="col-status"></div>
              <div className="col-title">Title</div>
              <div className="col-category">Category</div>
              <div className="col-diff">Difficulty</div>
              <div className="col-point">Points</div>
            </div>

            <div className="lc-rows-wrapper">
              {currentData.length === 0 ? (
                <div className="lc-empty">
                  {searchTerm ? "Không tìm thấy bài tập phù hợp." : "Chưa có bài tập nào."}
                </div>
              ) : (
                currentData.map((prob) => {
                  const isSolved = prob.is_solved; 
                  
                  const diffClass = 
                    prob.difficulty === "Dễ" ? "lc-easy" : 
                    prob.difficulty === "Trung bình" ? "lc-med" : "lc-hard";
                    
                  const diffText = 
                    prob.difficulty === "Dễ" ? "Easy" : 
                    prob.difficulty === "Trung bình" ? "Med." : "Hard";

                  return (
                    <Link to={`/problems/${prob.endpoint}`} key={prob.id} className="lc-row lc-item">
                      <div className="col-status">
                        {isSolved ? <Check size={16} className="lc-solved-icon" strokeWidth={3} /> : <Circle size={16} className="lc-unsolved-icon" />}
                      </div>
                      <div className="col-title">{prob.id}. {prob.title}</div>
                      <div className="col-category">{prob.category}</div>
                      <div className={`col-diff ${diffClass}`}>{diffText}</div>
                      <div className="col-point">{prob.point}</div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {(totalPages > 1 || hasNextFromAPI) && (
            <div className="lc-pagination">
              <button 
                className="page-btn" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              
              {pageNumbers.map(number => (
                <button 
                  key={number}
                  className={`page-btn ${currentPage === number ? 'active' : ''}`}
                  onClick={() => setCurrentPage(number)}
                >
                  {number}
                </button>
              ))}

              <button 
                className="page-btn" 
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage === totalPages && !hasNextFromAPI}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </main>

        {/* ================= 2. LEADERBOARD (NỔI TỰ DO Ở GÓC PHẢI) ================= */}
        {/* Thuộc tính Absolute giúp khối này không có tác động vật lý lên bảng Problems */}
        <aside style={{ 
          position: 'absolute', 
          top: '32px',      // Ngang hàng với đỉnh của bảng Problems
          right: '32px',    // Bám chặt lề phải màn hình 32px
          bottom: '0',      // Kéo dài đến cuối trang
          width: '320px', 
          pointerEvents: 'none' // Xuyên click, để không vô tình che mất Problems nếu màn hình nhỏ
        }}>
          {/* Vẫn giữ hiệu ứng trôi theo (Sticky) siêu mượt */}
          <div style={{ position: 'sticky', top: '32px', pointerEvents: 'auto' }}>
            <TopLeaderboard />
          </div>
        </aside>

      </div>
    </div>
  );
}