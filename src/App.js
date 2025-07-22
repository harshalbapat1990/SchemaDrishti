import React, { useState, useCallback } from 'react';
import { ThemeProvider } from './state/themeContext';
import LayoutContainer from './components/LayoutContainer';
import ThemeToggle from './components/ThemeToggle';
import SqlEditor from './components/SqlEditor';
import SqlParsingStatus from './components/SqlParsingStatus';
import { useSqlParser } from './hooks/useSqlParser';
import './App.css';
import './styles/theme.css';

// SQL Editor Panel Component - Enhanced with parsing integration
function LeftPanel() {
  const [sqlContent, setSqlContent] = useState('');

  // SQL Parser integration
  const {
    parseResult,
    astResult,
    isLoading,
    error,
    parseStats,
    parseWithDebounce,
    parseImmediate,
    clearResults,
    getParsingStatus,
    hasContentChanged,
    hasResults,
    hasErrors,
    hasDiagramData
  } = useSqlParser();

  const handleSqlContentChange = useCallback((content, validation) => {
    setSqlContent(content);
    
    console.log('SQL content changed:', {
      length: content.length,
      validation,
      hasContentChanged: hasContentChanged(content)
    });
    
    // Trigger SQL parsing with debounce if content has changed
    if (hasContentChanged(content)) {
      parseWithDebounce(content);
    }
  }, [hasContentChanged, parseWithDebounce]);

  // Handle manual parse request from editor (F5, Ctrl+Enter)
  const handleParseRequest = useCallback((content) => {
    if (content) {
      parseImmediate(content);
      console.log('Manual parse requested for content length:', content.length);
    }
  }, [parseImmediate]);

  const parsingStatus = getParsingStatus();

  return (
    <div className="panel-container">
      {/* SQL Editor takes main space */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <SqlEditor 
          onContentChange={handleSqlContentChange}
          onParseRequest={handleParseRequest}
          initialContent=""
        />
      </div>
      
      {/* Parsing Status at bottom - compact integration */}
      {(isLoading || hasResults || error) && (
        <div style={{ 
          flexShrink: 0,
          maxHeight: '250px',
          overflow: 'auto',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <SqlParsingStatus
            status={parsingStatus}
            stats={parseStats}
            errors={parseResult?.errors || []}
            warnings={parseResult?.warnings || []}
            onRetry={() => handleParseRequest(sqlContent)}
            onClear={hasResults ? clearResults : null}
            isCompact={false}
          />
        </div>
      )}
    </div>
  );
}

// Diagram Panel Component - Enhanced with parsing results
function RightPanel() {
  // Access parsing state through hook
  const {
    astResult,
    isLoading,
    parseStats,
    hasErrors,
    hasDiagramData,
    getParsingStatus
  } = useSqlParser();

  const parsingStatus = getParsingStatus();

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
          {hasDiagramData && (
            <span style={{ 
              marginLeft: '0.5rem', 
              fontSize: '0.8rem', 
              color: 'var(--success-color)',
              fontWeight: 'normal'
            }}>
              ✅ Ready
            </span>
          )}
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
          {isLoading ? (
            // Parsing state
            <>
              <div style={{ 
                width: '48px', 
                height: '48px',
                border: '4px solid var(--border-color)',
                borderTop: '4px solid var(--primary-color)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem'
              }}></div>
              <div style={{ marginBottom: '0.5rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Parsing SQL...
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Analyzing your database schema
              </div>
            </>
          ) : hasErrors ? (
            // Error state
            <>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
              <div style={{ marginBottom: '0.5rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Parsing Errors Found
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Please fix the SQL errors to generate the diagram
              </div>
            </>
          ) : hasDiagramData ? (
            // Success state with parsed data
            <>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
              <div style={{ marginBottom: '0.5rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Schema Parsed Successfully!
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Found {parseStats.totalTables} table(s), {parseStats.totalRelationships} relationship(s)
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Mermaid diagram rendering will be implemented in Task 5
              </div>
              
              {/* Preview of parsed tables */}
              {astResult && astResult.tables && Object.keys(astResult.tables).length > 0 && (
                <div style={{ 
                  marginTop: '1.5rem', 
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--border-radius)',
                  fontSize: '0.8rem',
                  textAlign: 'left',
                  maxWidth: '300px'
                }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Parsed Tables:</strong>
                  <ul style={{ margin: '0.5rem 0 0 0', padding: '0 0 0 1rem', color: 'var(--text-secondary)' }}>
                    {Object.keys(astResult.tables).slice(0, 5).map(tableName => (
                      <li key={tableName} style={{ margin: '0.25rem 0' }}>
                        <strong>{tableName}</strong> ({astResult.tables[tableName].columns.size} columns)
                      </li>
                    ))}
                    {Object.keys(astResult.tables).length > 5 && (
                      <li style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        ... and {Object.keys(astResult.tables).length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </>
          ) : (
            // Default state
            <>
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
                <strong>Task 4 Complete ✅:</strong>
                <br />• Real-time SQL parsing ✅
                <br />• Schema extraction & validation ✅
                <br />• Error handling & feedback ✅
                <br />
                <strong>Task 5 Coming Next:</strong>
                <br />• Mermaid diagram generation
                <br />• Interactive diagram elements
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <div className="app">
        {/* Header - Enhanced with parsing status */}
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
                <span className="shortcut-hint">Ctrl+Shift+F to format • F5 to parse • Ctrl+S to save</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Layout - Unchanged structure */}
        <main className="app-main">
          <LayoutContainer
            leftPanel={<LeftPanel />}
            rightPanel={<RightPanel />}
            defaultSplitPercentage={30}  // 30% for editor, 70% for diagram
            minLeftWidth={300}           // Minimum width for editor panel
            minRightWidth={400}          // Minimum width for diagram panel
          />
        </main>

        {/* Status Bar - Enhanced */}
        <footer className="app-footer">
          <div className="app-footer-content">
            <span>MVP 1 - Task 4: SQL Parser & AST Generation ✅</span>
            <span>Monaco Editor • SQL Parsing • Real-time validation • Auto-save enabled</span>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}

export default App;
