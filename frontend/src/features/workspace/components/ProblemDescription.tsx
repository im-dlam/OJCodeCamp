import React, { useState } from 'react';
import { FileText, Beaker, CheckCircle } from 'lucide-react';
import './Workspace.css';
import type { ProblemDetail } from '../../../types'; 
import { SubmissionsPanel } from './Submission';

interface Props {
  problem: ProblemDetail | null;
  isLoading: boolean;
}

export const ProblemDescription: React.FC<Props> = ({ problem, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'description' | 'submissions'>('description');

  if (isLoading) {
    return <div className="desc-content"><p style={{ color: '#8c8c8c' }}>Đang tải đề bài...</p></div>;
  }

  if (!problem) {
    return <div className="desc-content"><p style={{ color: '#ef4444' }}>Không tìm thấy bài toán!</p></div>;
  }

  const diffColor = 
    problem.difficulty === 'Dễ' ? 'tag-easy' : 
    problem.difficulty === 'Trung bình' ? 'tag-medium' : 'tag-hard'; 

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* tabmenu*/}
      <div className="panel-tabs">
        <button 
          className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
          onClick={() => setActiveTab('description')}
        >
          <FileText size={14} /> Description
        </button>
        <button className="tab-btn"><Beaker size={14} /> Solutions</button>
        <button 
          className={`tab-btn ${activeTab === 'submissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('submissions')}
        >
          <CheckCircle size={14} /> Submissions
        </button>
      </div>

      {/* content */}
      <div className="desc-content" style={{ flex: 1, overflowY: 'auto' }}>
        
        {activeTab === 'description' && (
          <>
            <h1 className="desc-title" style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
              {problem.id}. {problem.title}
            </h1>
            
            {/* Tags */}
            <div className="tag-container" style={{ marginBottom: '24px' }}>
              <span className={diffColor}>{problem.difficulty}</span>
              {problem.tags.map((tag) => (
                <span key={tag.id} className="tag-link">{tag.tag_name}</span>
              ))}
            </div>

            <div>
              {/* desc */}
              <div style={{ marginBottom: '32px', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '14px', color: '#eff1f6' }}>
                {problem.description}
              </div>
              
              {problem.examples.map((ex, index) => {
                const input = ex.input_text?.trim() || "";
                const output = ex.output_text?.trim() || "";
                const explanation = ex.explanation?.trim() || "";

                return (
                  <div key={ex.id} style={{ marginBottom: '24px' }}>
                    <p style={{ fontWeight: 600, color: '#eff1f6', marginBottom: '8px', fontSize: '14px' }}>
                      Ví dụ {index + 1}:
                    </p>
                    <pre style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      padding: '16px', 
                      borderRadius: '8px',
                      color: '#eff1f6',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word',
                      margin: 0,
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <strong style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff' }}>Input: </strong>
                      {input}
                      {'\n'}
                      <strong style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff' }}>Output: </strong>
                      {output}
                      {explanation && (
                        <>
                          {'\n'}
                          <strong style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff' }}>Giải thích: </strong>
                          {explanation}
                        </>
                      )}
                    </pre>
                  </div>
                );
              })}

              {problem.constraints && problem.constraints.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                  <p style={{ fontWeight: 600, color: '#eff1f6', marginBottom: '12px', fontSize: '14px' }}>Giới hạn:</p>
                  <ul style={{ 
                    listStyleType: 'disc', 
                    paddingLeft: '24px', 
                    margin: '0', 
                    color: '#eff1f6', 
                    lineHeight: '2.2',
                    fontSize: '13px'
                  }}>
                    {problem.constraints.map((c) => (
                      <li key={c.id}>
                        <code style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.08)', 
                          padding: '3px 6px', 
                          borderRadius: '5px', 
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', 
                          fontSize: '12px',
                          color: '#eff1f6'
                        }}>
                          {c.constraint_text.trim()}
                        </code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'submissions' && (
          <SubmissionsPanel problemId={problem.id} />
        )}

      </div>
    </div>
  );
}
