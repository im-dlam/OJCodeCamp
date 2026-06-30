import React, { useRef, useEffect } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
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
  onChangeLanguage,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleEditorWillMount = (monaco: Monaco) => {
    monaco.editor.defineTheme('dracula', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        // ----- Comment -----
        { token: 'comment', foreground: '6272A4', fontStyle: 'italic' },
        { token: 'comment.line', foreground: '6272A4', fontStyle: 'italic' },
        { token: 'comment.block', foreground: '6272A4', fontStyle: 'italic' },
        { token: 'comment.documentation', foreground: '6272A4', fontStyle: 'italic' },

        // ----- Keyword -----
        { token: 'keyword', foreground: 'FF79C6' },
        { token: 'keyword.control', foreground: 'FF79C6' },
        { token: 'keyword.operator', foreground: 'FF79C6' },
        { token: 'keyword.operator.new', foreground: 'FF79C6' },
        { token: 'keyword.other', foreground: 'FF79C6' },
        { token: 'storage', foreground: 'FF79C6' },
        { token: 'storage.type', foreground: 'FF79C6' },
        { token: 'storage.modifier', foreground: 'FF79C6' },

        // ----- String -----
        { token: 'string', foreground: 'F1FA8C' },
        { token: 'string.quoted', foreground: 'F1FA8C' },
        { token: 'string.template', foreground: 'F1FA8C' },
        { token: 'string.regexp', foreground: 'F1FA8C' },
        { token: 'string.escape', foreground: 'F1FA8C' },

        // ----- Number / Constant -----
        { token: 'number', foreground: 'BD93F9' },
        { token: 'number.hex', foreground: 'BD93F9' },
        { token: 'number.float', foreground: 'BD93F9' },
        { token: 'constant', foreground: 'BD93F9' },
        { token: 'constant.numeric', foreground: 'BD93F9' },
        { token: 'constant.language', foreground: 'BD93F9' },
        { token: 'constant.character', foreground: 'BD93F9' },
        { token: 'constant.character.escape', foreground: 'BD93F9' },

        // ----- Variable -----
        { token: 'variable', foreground: 'F8F8F2' },
        { token: 'variable.parameter', foreground: 'FFB86C' },
        { token: 'variable.other', foreground: 'F8F8F2' },
        { token: 'variable.language', foreground: 'F8F8F2' },
        { token: 'variable.object', foreground: 'F8F8F2' },

        // =========================================================
        //  Muốn đổi màu, sửa foreground của các token dưới đây
        // =========================================================
        {token: 'meta.function.python', foreground: '50FA7B'},
        { token: 'entity.name.function', foreground: '50FA7B' },
        { token: 'entity.name.method', foreground: '50FA7B' },
        { token: 'support.function', foreground: '50FA7B' },
        { token: 'support.function.builtin', foreground: '50FA7B' },
        { token: 'meta.function', foreground: '50FA7B' },
        { token: 'meta.method', foreground: '50FA7B' },
        { token: 'entity.name.function.decorator', foreground: '50FA7B' },
        { token: 'variable.function', foreground: '50FA7B' },
        { token: 'entity.name.function.call', foreground: '50FA7B' },

        // ----- Class / Type (giữ màu xanh dương) -----
        { token: 'entity.name.type', foreground: '8BE9FD' },
        { token: 'entity.name.class', foreground: '8BE9FD' },
        { token: 'entity.name.namespace', foreground: '8BE9FD' },
        { token: 'entity.name.struct', foreground: '8BE9FD' },
        { token: 'entity.name.union', foreground: '8BE9FD' },
        { token: 'entity.name.interface', foreground: '8BE9FD' },
        { token: 'support.class', foreground: '8BE9FD' },
        { token: 'support.type', foreground: '8BE9FD' },

        // ----- Type (generic) -----
        { token: 'type', foreground: '8BE9FD' },
        { token: 'type.identifier', foreground: '8BE9FD' },
        { token: 'type.parameter', foreground: '8BE9FD' },

        // ----- Tag / Attribute (HTML/XML) -----
        { token: 'tag', foreground: 'FF79C6' },
        { token: 'tag.name', foreground: 'FF79C6' },
        { token: 'attribute.name', foreground: '50FA7B' },
        { token: 'attribute.value', foreground: 'F1FA8C' },

        // ----- Decorator / Annotation (Python) -----
        { token: 'entity.other.attribute-name', foreground: '50FA7B' },
        { token: 'punctuation.decorator', foreground: '50FA7B' },

        // ----- Punctuation / Delimiter -----
        { token: 'delimiter', foreground: 'F8F8F2' },
        { token: 'delimiter.bracket', foreground: 'F8F8F2' },
        { token: 'delimiter.parenthesis', foreground: 'F8F8F2' },
        { token: 'delimiter.square', foreground: 'F8F8F2' },
        { token: 'delimiter.curly', foreground: 'F8F8F2' },

        // ----- Operator -----
        { token: 'keyword.operator', foreground: 'FF79C6' },
        { token: 'operator', foreground: 'FF79C6' },
        { token: 'operator.assignment', foreground: 'FF79C6' },
        { token: 'operator.arithmetic', foreground: 'FF79C6' },

        // ----- Support / Built-in (Python) -----
        { token: 'support.function.builtin', foreground: '50FA7B' },
        { token: 'support.constant', foreground: 'BD93F9' },
        { token: 'support.variable', foreground: 'F8F8F2' },

        // ----- Invalid -----
        { token: 'invalid', foreground: 'FF5555' },
        { token: 'invalid.illegal', foreground: 'FF5555' },
        { token: 'invalid.deprecated', foreground: 'FF5555' },
      ],
      colors: {
        // ---- Editor background ----
        'editor.background': '#282A36',
        'editor.foreground': '#F8F8F2',

        // ---- Cursor ----
        'editorCursor.foreground': '#F8F8F2',

        // ---- Selection ----
        'editor.selectionBackground': '#44475A',
        'editor.selectionHighlightBackground': '#44475A66',
        'editor.inactiveSelectionBackground': '#44475A55',

        // ---- Line highlight ----
        // 'editor.lineHighlightBackground': '#44475A55',
        'editor.lineHighlightBorder': '#44475A55',

        // ---- Find / Search ----
        'editor.findMatchBackground': '#FFB86C66',
        'editor.findMatchHighlightBackground': '#FFB86C33',
        'editor.findRangeHighlightBackground': '#FFB86C22',

        // ---- Line numbers ----
        'editorLineNumber.foreground': '#6272A4',
        'editorLineNumber.activeForeground': '#F8F8F2',

        // ---- Indent guides ----
        'editorIndentGuide.background': '#44475A',
        'editorIndentGuide.activeBackground': '#6272A4',

        // ---- Bracket matching ----
        'editorBracketMatch.background': '#BD93F922',
        'editorBracketMatch.border': '#BD93F9',

        // ---- Whitespace (invisible characters) ----
        'editorWhitespace.foreground': '#44475A',

        // ---- Gutter (left bar) ----
        'editorGutter.background': '#282A36',

        // ---- Suggest widget (IntelliSense) ----
        'editorSuggestWidget.background': '#282A36',
        'editorSuggestWidget.border': '#44475A',
        'editorSuggestWidget.foreground': '#F8F8F2',
        'editorSuggestWidget.selectedBackground': '#44475A',
        'editorSuggestWidget.highlightForeground': '#8BE9FD',

        // ---- Hover widget ----
        'editorHoverWidget.background': '#282A36',
        'editorHoverWidget.border': '#44475A',

        // ---- Scrollbar ----
        'scrollbarSlider.background': '#44475A88',
        'scrollbarSlider.hoverBackground': '#6272A488',
        'scrollbarSlider.activeBackground': '#BD93F988',

        // ---- Diff ----
        'diffEditor.insertedTextBackground': '#50FA7B22',
        'diffEditor.removedTextBackground': '#FF555522',

        // ---- Bracket pair colorization (optional) ----
        'editorBracketHighlight.foreground1': '#FF79C6',
        'editorBracketHighlight.foreground2': '#8BE9FD',
        'editorBracketHighlight.foreground3': '#50FA7B',
        'editorBracketHighlight.foreground4': '#F1FA8C',
        'editorBracketHighlight.foreground5': '#BD93F9',
        'editorBracketHighlight.foreground6': '#FFB86C',
      },
    });
  };

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const blockTouch = (e: TouchEvent) => {
      e.stopPropagation();
    };

    wrapper.addEventListener('touchstart', blockTouch, { capture: true, passive: true });
    wrapper.addEventListener('touchmove', blockTouch, { capture: true, passive: true });
    wrapper.addEventListener('touchend', blockTouch, { capture: true, passive: true });
    wrapper.addEventListener('touchcancel', blockTouch, { capture: true, passive: true });

    return () => {
      wrapper.removeEventListener('touchstart', blockTouch, { capture: true });
      wrapper.removeEventListener('touchmove', blockTouch, { capture: true });
      wrapper.removeEventListener('touchend', blockTouch, { capture: true });
      wrapper.removeEventListener('touchcancel', blockTouch, { capture: true });
    };
  }, []);

  return (
    <>
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div>
          <select
            className="lang-select"
            value={language}
            onChange={(e) => onChangeLanguage(e.target.value)}
          >
            <option value="cpp">C++</option>
            <option value="python">Python</option>
            {/* <option value="java">Java</option> */}
          </select>
        </div>
        <div className="editor-icons">
          <RotateCcw size={14} />
          <Settings size={14} />
          <Maximize2 size={14} />
        </div>
      </div>

      {/* Editor container */}
      <div
        ref={wrapperRef}
        style={{ flex: 1, backgroundColor: '#282A36' }}
      >
        <Editor
          height="100%"
          language={language}
          theme="dracula"
          beforeMount={handleEditorWillMount}
          value={code}
          onChange={(val) => onChangeCode(val || '')}
          options={{
            // ---- Layout ----
            minimap: { enabled: false },
            automaticLayout: true,

            // ---- Font & Ligatures ----
            fontSize: 15,
            fontFamily: '"JetBrains Mono", "Cascadia Code", "Fira Code", Consolas, monospace',
            fontLigatures: true,
            lineHeight: 24,

            // ---- Cursor & Scrolling ----
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            scrollBeyondLastLine: false,

            // ---- Highlighting ----
            renderLineHighlight: 'all',
            renderWhitespace: 'selection',
            // renderIndentGuides: true,
            occurrencesHighlight: 'singleFile',
            selectionHighlight: true,
            bracketPairColorization: { enabled: true },

            // ---- Tabs / Spaces ----
            tabSize: 2,
            insertSpaces: true,

            // ---- Word Wrap ----
            wordWrap: 'on',

            // ---- Padding ----
            padding: {
              top: 16,
              bottom: 16,
            },

            // ---- Scrollbar ----
            scrollbar: {
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
              alwaysConsumeMouseWheel: false,
              handleMouseWheel: true,
            },

            // ---- Accessibility ----
            accessibilitySupport: 'off',

            // ---- Extra ----
            suggest: {
              showKeywords: true,
              showSnippets: false,
            },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false,
            },
          }}
        />
      </div>
    </>
  );
};