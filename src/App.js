import React from 'react';
import { ThemeProvider } from './state/themeContext';
import LayoutContainer from './components/LayoutContainer';
import ThemeToggle from './components/ThemeToggle';
import './App.css';
import './styles/theme.css';

// Temporary placeholder panels for testing
function LeftPanel() {
  return (
    <div style={{ 
      padding: '1rem', 
      height: '100%', 
      backgroundColor: 'var(--bg-secondary)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
        SQL Editor Panel (30%)
      </h3>
      <div style={{ 
        flex: 1,
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius)',
        padding: '1rem',
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        color: 'var(--text-muted)'
      }}>
        -- Monaco Editor will go here
        <br />
        CREATE TABLE Users (
        <br />
        &nbsp;&nbsp;ID int PRIMARY KEY,
        <br />
        &nbsp;&nbsp;Name varchar(100) NOT NULL,
        <br />
        &nbsp;&nbsp;Email varchar(255) UNIQUE,
        <br />
        &nbsp;&nbsp;CreatedDate datetime DEFAULT GETDATE()
        <br />
        );
        <br />
        <br />
        CREATE TABLE Orders (
        <br />
        &nbsp;&nbsp;OrderID int PRIMARY KEY,
        <br />
        &nbsp;&nbsp;UserID int FOREIGN KEY REFERENCES Users(ID),
        <br />
        &nbsp;&nbsp;OrderDate datetime,
        <br />
        &nbsp;&nbsp;Total decimal(10,2)
        <br />
        );
      </div>
    </div>
  );
}

function RightPanel() {
  return (
    <div style={{ 
      padding: '1rem', 
      height: '100%', 
      backgroundColor: 'var(--bg-secondary)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
        Diagram Viewer Panel (70%)
      </h3>
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
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <div style={{ marginBottom: '0.5rem' }}>Mermaid.js ERD will render here</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            This larger panel (70%) will show the database diagram
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
            minLeftWidth={250}           // Minimum width for editor panel
            minRightWidth={300}          // Minimum width for diagram panel
          />
        </main>

        {/* Status Bar */}
        <footer className="app-footer">
          <div className="app-footer-content">
            <span>MVP 1 - Task 2: Layout Container & Theme System ✅</span>
            <span>30% Editor | 70% Diagram | Drag to resize</span>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}

export default App;
