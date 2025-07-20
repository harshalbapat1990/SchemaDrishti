import React from 'react';
import './App.css';
import './styles/theme.css';

function App() {
  return (
    <div className="flex flex-column" style={{ 
      height: '100vh', 
      backgroundColor: 'var(--bg-primary)', 
      color: 'var(--text-primary)' 
    }}>
      <header style={{ 
        padding: '1rem', 
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <h1>SchemaDrishti</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          SQL Server Schema Design & Visualization Tool - MVP 1
        </p>
      </header>
      
      <main className="flex-1" style={{ 
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem' }}>🚧 Under Construction</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Task 1 Complete: Project Setup & Infrastructure
          </p>
          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            backgroundColor: 'var(--bg-secondary)', 
            borderRadius: 'var(--border-radius)',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ marginBottom: '0.5rem' }}>✅ Completed Setup:</h3>
            <ul style={{ 
              textAlign: 'left', 
              color: 'var(--text-secondary)',
              listStyle: 'none',
              padding: 0
            }}>
              <li>✅ React project with JavaScript</li>
              <li>✅ Monaco Editor & Mermaid dependencies</li>
              <li>✅ Theme system with CSS variables</li>
              <li>✅ Utility functions and constants</li>
              <li>✅ ESLint configuration</li>
              <li>✅ Folder structure ready</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
