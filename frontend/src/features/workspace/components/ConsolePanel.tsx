import React, { useState, useEffect } from 'react';
import { Terminal, CheckSquare, Play, Loader2 } from 'lucide-react';
import type { ProblemExample } from '../../../types';
import { useSubmitCode, useFetchSubmitResult } from '../../../hooks/useSubmission';
import { toast } from 'react-hot-toast'; 

import './Workspace.css';

interface ConsolePanelProps {
  examples?: ProblemExample[];
  problemId?: number;
  currentCode: string;
  language: string;
}

const API_LANGUAGE_MAP: Record<string, string> = {
  'python': 'Python',
  'cpp': 'C++',
  'java': 'Java',
  'javascript': 'JavaScript',
  'go': 'Go'
} as const;

export const ConsolePanel: React.FC<ConsolePanelProps> = ({ 
  examples = [], 
  problemId, 
  currentCode, 
  language 
}) => {
  const [activeTab, setActiveTab] = useState('testcase');
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [testInputs, setTestInputs] = useState<string[]>([]);
  const [activeSubId, setActiveSubId] = useState<number | null>(null);

  const { mutate: submitCode, isPending: isSubmitting, isError: isSubmitError, error: submitError } = useSubmitCode();
  const { data: resultData, isLoading: isPolling, isError: isPollingError, error: pollingError } = useFetchSubmitResult(activeSubId);

  useEffect(() => {
    if (examples && examples.length > 0) {
      setTestInputs(examples.map(ex => ex.input_text));
      setActiveCaseIndex(0);
    }
  }, [examples]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newInputs = [...testInputs];
    newInputs[activeCaseIndex] = e.target.value;
    setTestInputs(newInputs);
  };

  const getInputRows = (text: string) => Math.max(1, text?.split('\n').length || 1);

  const handleSubmit = () => {
    if (!problemId) {
      toast.error('Problem ID is missing.');
      return;
    }
    
    if (!currentCode.trim()) {
      toast.error('Code cannot be empty.');
      return;
    }

    setActiveTab('result'); 
    setActiveSubId(null);   

    const backendLanguage = API_LANGUAGE_MAP[language] || language;

    submitCode({
      code: currentCode,
      language: backendLanguage,
      problem_id: problemId
    }, {
      onSuccess: (data) => {
        toast.success('Code submitted successfully.');
        setActiveSubId(data.submission_id);
      },
      onError: (err) => {
        toast.error(`${err.message}`);
      }
    });
  };

  const isEvaluating = Boolean(
    isSubmitting || 
    (resultData?.status === 'Pending') || 
    (activeSubId && isPolling)
  );

  const isFinished = Boolean(resultData && resultData.status !== 'Pending');
  const isAccepted = resultData?.status === 'Accepted';
  const isCompilationError = resultData?.status === 'Compilation Error';

  const failedCase = isFinished && !isAccepted && resultData?.results 
    ? resultData.results.find((tc: any) => tc.result !== 'Accepted') 
    : null;

  return (
    <>
      <div className="panel-tabs">
        <button 
          onClick={() => setActiveTab('testcase')}
          className={`tab-btn ${activeTab === 'testcase' ? 'active' : ''}`}
        >
          <CheckSquare size={14} /> Testcase
        </button>
        <button 
          onClick={() => setActiveTab('result')}
          className={`tab-btn ${activeTab === 'result' ? 'active' : ''}`}
        >
          <Terminal size={14} /> Test Result
        </button>
      </div>

      <div className="desc-content">
        {activeTab === 'testcase' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {examples.map((_, index) => (
                <button 
                  key={index}
                  onClick={() => setActiveCaseIndex(index)}
                  className={`case-btn ${activeCaseIndex === index ? 'active' : ''}`}
                >
                  Case {index + 1}
                </button>
              ))}
              
              {examples.length === 0 && (
                <span style={{fontSize: '12px', color: '#9ca3af'}}>No testcases available.</span>
              )}
            </div>
            
            {examples.length > 0 && (
              <>
                <div className="input-group">
                  <label className="input-label">Input</label>
                  <textarea 
                    value={testInputs[activeCaseIndex] || ''}
                    onChange={handleInputChange}
                    className="input-field"
                    rows={getInputRows(testInputs[activeCaseIndex])}
                    style={{ 
                      resize: 'vertical', fontFamily: 'monospace', whiteSpace: 'pre',
                      padding: '6px 12px', minHeight: '34px', lineHeight: '1.4', fontSize: '13px'
                    }} 
                  />
                </div>

                <div className="input-group" style={{ marginTop: '12px' }}>
                  <label className="input-label">Target</label>
                  <textarea 
                    value={examples[activeCaseIndex]?.output_text || ''}
                    readOnly
                    className="input-field"
                    rows={getInputRows(examples[activeCaseIndex]?.output_text)}
                    style={{ 
                      resize: 'none', fontFamily: 'monospace', whiteSpace: 'pre',
                      opacity: 0.7, backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      padding: '6px 12px', minHeight: '34px', lineHeight: '1.4', fontSize: '13px'
                    }} 
                  />
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'result' && (
          <div>
            {(isSubmitError || isPollingError) && (
              <div style={{ color: '#ef4444', fontSize: '14px', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
                <strong></strong> {(submitError as Error)?.message || (pollingError as Error)?.message}
              </div>
            )}

            {isEvaluating && !isSubmitError && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100px', gap: '12px', color: '#3b82f6' }}>
                <Loader2 size={32} className="animate-spin" />
                <span style={{ fontWeight: 500 }}>Submit...</span>
              </div>
            )}

            {isFinished && resultData && (
              <div className="result-container">
                <h2 className={`result-header ${isAccepted ? 'text-accepted' : 'text-error'}`}>
                  {resultData.status}
                </h2>

                {!isCompilationError && (
                  <div className="stat-passed">
                    {resultData.passed} / {resultData.total} testcases passed
                  </div>
                )}

                <div className="stats-container">
                  <div className="stat-box">
                    <div className="stat-title">Runtime</div>
                    <div className="stat-value">{resultData.execution_time ? `${resultData.execution_time}ms` : 'N/A'}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-title">Memory</div>
                    <div className="stat-value">{resultData.memory_used || 'N/A'}</div>
                  </div>
                </div>

                {!isAccepted && (
                  <div className="failed-case-box">
                    {isCompilationError ? (
                      <>
                        <div className="failed-case-title">Compilation Error Details</div>
                        <div className="io-value">
                          {resultData.results?.[0]?.error_message || "Unknown compilation error."}
                        </div>
                      </>
                    ) : (
                      failedCase && (
                        <>
                          <div className="failed-case-title">
                            Testcase Failed 
                            <span style={{color: '#8c8c8c', fontSize: '13px', fontWeight: 'normal', marginLeft: '8px'}}>
                              (Case {failedCase.test_case_id})
                            </span>
                          </div>
                          
                          {failedCase.error_message ? (
                            <div className="io-value">{failedCase.error_message}</div>
                          ) : (
                            <>
                              <div className="io-label">Input</div>
                              <div className="io-value" style={{ color: '#eff1f6' }}>{failedCase.input_text}</div>
                              
                              <div className="io-label">Output</div>
                              <div className="io-value">{failedCase.output_text || "No Output"}</div>
                              
                              <div className="io-label">Expected</div>
                              <div className="io-value expected">{failedCase.expected_output}</div>
                            </>
                          )}
                        </>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {!isEvaluating && !isFinished && !isSubmitError && !isPollingError && (
              <div style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>
                Please run or submit your code to see the results.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="console-actions">
        <button className="btn-run"><Play size={14} /> Run</button>
        <button 
          className="btn-submit" 
          onClick={handleSubmit}
          disabled={isEvaluating}
          style={{ 
            opacity: isEvaluating ? 0.7 : 1, 
            cursor: isEvaluating ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            justifyContent: 'center'
          }}
        >
          {isEvaluating ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Submit...
            </>
          ) : (
            'Submit'
          )}
        </button>
      </div>
    </>
  );
};