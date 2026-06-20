// file: Home.tsx
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

  // fix: reset về trang 1 khi thay đổi các bộ lọc tìm kiếm
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
      
      <div style={{ position: 'relative', width: '100%', minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        
        <main className="lc-main-content">
          
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
                  placeholder="Search questions..." 
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
              <button className="lc-icon-btn" title="Bộ lọc nâng cao">
                <SlidersHorizontal size={16} />
              </button>
            </div>
            
            <div className="lc-toolbar-right">
              <div className="lc-progress-text">
                <Database size={14} className="progress-icon" /> 
                <span>{currentCountFromAPI} / {totalFromAPI} problems</span>
              </div>
              <button className="lc-icon-btn lc-pick-random" title="Chọn ngẫu nhiên 1 bài">
                <Shuffle size={16} />
              </button>
            </div>
          </div>

          <div className="lc-list-container">
            <div className="lc-rows-wrapper">
              {currentData.length === 0 ? (
                <div className="lc-empty">
                  <div className="empty-icon"><Search size={32} /></div>
                  <p>{searchTerm ? "Không tìm thấy bài tập phù hợp." : "Chưa có bài tập nào."}</p>
                </div>
              ) : (
                currentData.map((prob) => {
                  const isSolved = prob.is_solved; 
                  
                  const diffClass = 
                    prob.difficulty === "Dễ" ? "lc-easy" : 
                    prob.difficulty === "Trung bình" ? "lc-med" : "lc-hard";
                    
                  const diffText = 
                    prob.difficulty === "Dễ" ? "Easy" : 
                    prob.difficulty === "Trung bình" ? "Medium" : "Hard";

                  return (
                    <Link to={`/problems/${prob.endpoint}`} key={prob.id} className="lc-row lc-item">
                      <div className="col-status" title={isSolved ? "Đã giải quyết" : "Chưa giải quyết"}>
                        {isSolved ? (
                          <Check size={18} className="lc-solved-icon" strokeWidth={3} />
                        ) : (
                          <Circle size={14} className="lc-unsolved-icon" strokeWidth={2.5} />
                        )}
                      </div>
                      <div className="col-title" title={prob.title}>
                        <span className="prob-id">{prob.id}.</span> {prob.title}
                      </div>
                      <div className="col-category">
                        <span className="category-pill" title={`Danh mục: ${prob.category}`}>{prob.category}</span>
                      </div>
                      <div className="col-acceptance" title={`Tỷ lệ chấp nhận (Acceptance Rate): ${prob.acceptance_rate}%`}>
                        {prob.acceptance_rate}%
                      </div>
                      <div className={`col-diff ${diffClass}`} title={`Độ khó: ${diffText}`}>
                        {diffText}
                      </div>
                      <div className="col-point" title={`Điểm thưởng (Points): ${prob.point}`}>
                        {prob.point}
                      </div>
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
                onClick={() => setCurrentPage(prev => Math.max(prev + 1, totalPages))}
                disabled={currentPage === totalPages && !hasNextFromAPI}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </main>

        <aside className="lc-leaderboard-aside">
          <div className="lc-leaderboard-sticky">
            <TopLeaderboard />
          </div>
        </aside>

      </div>
    </div>
  );
}