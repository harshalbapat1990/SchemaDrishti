import React, { useState, useCallback } from 'react';
import { ThemeProvider } from './state/themeContext';
import LayoutContainer from './components/LayoutContainer';
import ThemeToggle from './components/ThemeToggle';
import SqlEditor from './components/SqlEditor';
import './App.css';
import './styles/theme.css';

// SQL Editor Panel Component
function LeftPanel() {
  const [sqlContent, setSqlContent] = useState('');

  const handleSqlContentChange = useCallback((content) => {
    setSqlContent(content);
    // Future: Trigger SQL parsing and diagram update
    console.log('SQL content changed, length:', content.length);
  }, []);

  return (
    <div className="panel-container">
      <SqlEditor 
        onContentChange={handleSqlContentChange}
        initialContent=""
      />
    </div>
  );
}

// Diagram Panel Component (still placeholder)
function RightPanel() {
  return (
    <div style={{ 
      padding: '1rem', 
      height: '100%', 
      backgroundColor: 'var(--bg-secondary)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div className="panel-header">
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
          <span style={{ marginRight: '0.5rem' }}>📊</span>
          Database Diagram
        </h3>
      </div>
      <div style={{ 
        flex: 1,
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius)',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔄</div>
          <div style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>
            Mermaid.js ERD will render here
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Live diagram updates as you type SQL in the editor
          </div>
          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--border-radius)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            <strong>Coming in Task 4:</strong>
            <br />• Real-time SQL parsing
            <br />• Entity-relationship diagram generation
            <br />• Interactive diagram elements
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <div className="app">
        {/* Header */}
        <header className="app-header">
          <div className="app-header-content">
            <div className="app-title">
              <h1>SchemaDrishti</h1>
              <span className="app-subtitle">
                SQL Server Schema Design & Visualization Tool
              </span>
            </div>
            <div className="app-header-controls">
              <div className="editor-controls">
                <span className="shortcut-hint">Ctrl+Shift+F to format • F5 to run</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <main className="app-main">
          <LayoutContainer
            leftPanel={<LeftPanel />}
            rightPanel={<RightPanel />}
            defaultSplitPercentage={30}  // 30% for editor, 70% for diagram
            minLeftWidth={300}           // Minimum width for editor panel
            minRightWidth={400}          // Minimum width for diagram panel
          />
        </main>

        {/* Status Bar */}
        <footer className="app-footer">
          <div className="app-footer-content">
            <span>MVP 1 - Task 3: Monaco SQL Editor ✅</span>
            <span>Monaco Editor • SQL IntelliSense • Auto-save enabled</span>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}

export default App;
