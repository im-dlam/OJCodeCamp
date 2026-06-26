import React from 'react';
import Editor from '@monaco-editor/react';
import { Settings, RotateCcw, Maximize2 } from 'lucide-react';
import './Workspace.css';

interface EditorPanelProps {
  code: string;
  onChangeCode: (value: string) => void;
  language: string;
  onChangeLanguage: (lang: string) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ 
  code, 
  onChangeCode, 
  language, 
  onChangeLanguage 
}) => {
  return (
    <>
      <div className="editor-toolbar">
        <div>
          <select 
            className="lang-select"
            value={language}
            onChange={(e) => onChangeLanguage(e.target.value)}
          >
            <option value="cpp">C++</option>
            <option value="python">Python</option>
            {/* <option value="Java">Java</option> */}
          </select>
        </div>
        <div className="editor-icons">
          <RotateCcw size={14} />
          <Settings size={14} />
          <Maximize2 size={14} />
        </div>
      </div>

      <div style={{ flex: 1, backgroundColor: '#1e1e1e' }}>
        <Editor
          height="100%"
          language={language} 
          theme="vs-dark"
          value={code} 
          onChange={(val) => onChangeCode(val || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineHeight: 24,
            padding: { top: 16 },
            scrollbar: {
              alwaysConsumeMouseWheel: false
            },
            scrollBeyondLastLine: false,
            accessibilitySupport: 'off'
          }}
        />
      </div>
    </>
  );
};