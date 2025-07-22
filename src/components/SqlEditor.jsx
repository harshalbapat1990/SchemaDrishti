import React, { useState, useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../state/themeContext';
import { STORAGE_KEYS, EDITOR_DEFAULTS } from '../utils/constants';
import { getStorageValue, setStorageValue, debounce, validateSqlContent } from '../utils/helpers';
import './SqlEditor.css';

function SqlEditor({ onContentChange, onParseRequest, initialContent = '' }) {
  const { isDark } = useTheme();
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  
  // Editor state
  const [content, setContent] = useState(() => {
    // Load from localStorage or use initial content
    const saved = getStorageValue(STORAGE_KEYS.SQL_CONTENT, '');
    return saved || initialContent || getDefaultSqlContent();
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [validationResult, setValidationResult] = useState(null);
  const [editorOptions, setEditorOptions] = useState({
    fontSize: EDITOR_DEFAULTS.FONT_SIZE,
    tabSize: EDITOR_DEFAULTS.TAB_SIZE,
    insertSpaces: true,
    wordWrap: 'on',
    lineNumbers: 'on',
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    formatOnType: true,
    formatOnPaste: true,
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
    parameterHints: { enabled: true },
    hover: { enabled: true },
    contextmenu: true,
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    renderLineHighlight: 'line',
    renderWhitespace: 'selection'
  });

  // Debounced save and validation function
  const saveAndValidateContent = useCallback(
    debounce((value) => {
      setStorageValue(STORAGE_KEYS.SQL_CONTENT, value);
      
      // Validate content
      const validation = validateSqlContent(value);
      setValidationResult(validation);
      
      // Notify parent component
      if (onContentChange) {
        onContentChange(value, validation);
      }
    }, 500),
    [onContentChange]
  );

  // Manual save function for keyboard shortcut
  const handleManualSave = useCallback(() => {
    const currentContent = editorRef.current?.getValue() || '';
    setStorageValue(STORAGE_KEYS.SQL_CONTENT, currentContent);
    
    // Validate immediately on manual save
    const validation = validateSqlContent(currentContent);
    setValidationResult(validation);
    
    if (onContentChange) {
      onContentChange(currentContent, validation);
    }
    
    // Show a temporary save indicator
    const statusElement = document.querySelector('.sql-editor-status .ready');
    if (statusElement) {
      const originalText = statusElement.textContent;
      statusElement.textContent = 'Saved!';
      statusElement.style.color = 'var(--success-color)';
      setTimeout(() => {
        statusElement.textContent = originalText;
        statusElement.style.color = 'var(--success-color)';
      }, 1000);
    }
    
    console.log('Manual save completed with validation:', validation);
  }, [onContentChange]);

  // Format code function for keyboard shortcut
  const handleFormatCode = useCallback(async () => {
    if (!editorRef.current || !monacoRef.current) return;
    
    try {
      // Trigger the built-in format document action
      await editorRef.current.getAction('editor.action.formatDocument')?.run();
      
      // Show a temporary format indicator
      const statusElement = document.querySelector('.sql-editor-status .ready');
      if (statusElement) {
        const originalText = statusElement.textContent;
        statusElement.textContent = 'Formatted!';
        statusElement.style.color = 'var(--primary-color)';
        setTimeout(() => {
          statusElement.textContent = originalText;
          statusElement.style.color = 'var(--success-color)';
        }, 1000);
      }
      
      console.log('Code formatting completed');
    } catch (error) {
      console.error('Error formatting code:', error);
    }
  }, []);

  // Parse SQL function - NEW
  const handleParseRequest = useCallback(() => {
    const currentContent = editorRef.current?.getValue() || '';
    
    if (onParseRequest) {
      onParseRequest(currentContent);
    }
    
    // Show a temporary parse indicator
    const statusElement = document.querySelector('.sql-editor-status .ready');
    if (statusElement) {
      const originalText = statusElement.textContent;
      statusElement.textContent = 'Parsing...';
      statusElement.style.color = 'var(--warning-color)';
      setTimeout(() => {
        statusElement.textContent = originalText;
        statusElement.style.color = 'var(--success-color)';
      }, 2000);
    }
    
    console.log('Parse request triggered for content length:', currentContent.length);
  }, [onParseRequest]);

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsLoading(false);
    
    // Configure SQL language features
    configureSqlLanguage(monaco);
    
    // Set up keyboard shortcuts
    setupKeyboardShortcuts(editor, monaco);
    
    // Prevent editor from interfering with splitter drag
    const editorElement = editor.getDomNode();
    if (editorElement) {
      editorElement.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });
    }
    
    // Initial validation
    const validation = validateSqlContent(content);
    setValidationResult(validation);
    
    // Focus the editor
    editor.focus();
    
    console.log('Monaco Editor mounted successfully with validation');
  }, [content, handleManualSave, handleFormatCode, handleParseRequest]);

  // Handle content change
  const handleEditorChange = useCallback((value) => {
    setContent(value || '');
    saveAndValidateContent(value || '');
  }, [saveAndValidateContent]);

  // Setup keyboard shortcuts
  const setupKeyboardShortcuts = useCallback((editor, monaco) => {
    // Ctrl+S to save
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      handleManualSave,
      ''
    );

    // Ctrl+Shift+F to format code
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      handleFormatCode,
      ''
    );

    // F5 to parse SQL - NEW
    editor.addCommand(
      monaco.KeyCode.F5,
      handleParseRequest,
      ''
    );

    // Ctrl+Enter as alternative parse shortcut - NEW
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      handleParseRequest,
      ''
    );

    console.log('Keyboard shortcuts registered:');
    console.log('- Ctrl+S: Save');
    console.log('- Ctrl+Shift+F: Format');
    console.log('- F5: Parse SQL');
    console.log('- Ctrl+Enter: Parse SQL');
    
  }, [handleManualSave, handleFormatCode, handleParseRequest]);

  // Configure SQL language support
  const configureSqlLanguage = useCallback((monaco) => {
    // Enhanced SQL keywords for SQL Server
    const sqlKeywords = [
      'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER',
      'CREATE', 'TABLE', 'ALTER', 'DROP', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE',
      'PRIMARY', 'FOREIGN', 'KEY', 'REFERENCES', 'CONSTRAINT', 'INDEX', 'UNIQUE',
      'NOT', 'NULL', 'DEFAULT', 'CHECK', 'IDENTITY', 'AUTO_INCREMENT',
      'VARCHAR', 'NVARCHAR', 'CHAR', 'NCHAR', 'TEXT', 'NTEXT',
      'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'BIT',
      'DECIMAL', 'NUMERIC', 'FLOAT', 'REAL', 'MONEY', 'SMALLMONEY',
      'DATETIME', 'DATETIME2', 'SMALLDATETIME', 'DATE', 'TIME', 'TIMESTAMP',
      'BINARY', 'VARBINARY', 'IMAGE', 'UNIQUEIDENTIFIER',
      'AND', 'OR', 'LIKE', 'IN', 'EXISTS', 'BETWEEN', 'IS',
      'GROUP', 'BY', 'ORDER', 'HAVING', 'DISTINCT', 'TOP', 'LIMIT',
      'UNION', 'EXCEPT', 'INTERSECT', 'ALL', 'ANY', 'SOME',
      'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IF', 'ELSE',
      'BEGIN', 'END', 'TRANSACTION', 'COMMIT', 'ROLLBACK',
      'PROCEDURE', 'FUNCTION', 'TRIGGER', 'VIEW', 'SCHEMA', 'DATABASE',
      'GRANT', 'REVOKE', 'DENY', 'EXECUTE', 'AS',
      'GETDATE', 'GETUTCDATE', 'NEWID', 'ISNULL', 'COALESCE', 'CAST', 'CONVERT'
    ];

    // SQL Server specific functions
    const sqlFunctions = [
      'LEN', 'SUBSTRING', 'CHARINDEX', 'PATINDEX', 'REPLACE', 'STUFF',
      'UPPER', 'LOWER', 'LTRIM', 'RTRIM', 'REVERSE',
      'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'STDEV', 'VAR',
      'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'NTILE',
      'DATEPART', 'DATEDIFF', 'DATEADD', 'FORMAT',
      'ISNUMERIC', 'ISDATE', 'TRY_CAST', 'TRY_CONVERT'
    ];

    // Register completion provider
    monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model, position) => {
        const suggestions = [
          ...sqlKeywords.map(keyword => ({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            detail: 'SQL Keyword'
          })),
          ...sqlFunctions.map(func => ({
            label: func,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: func + '($1)',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'SQL Function'
          })),
          // Common table snippets
          {
            label: 'CREATE TABLE',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: [
              'CREATE TABLE ${1:TableName} (',
              '    ${2:ID} int IDENTITY(1,1) PRIMARY KEY,',
              '    ${3:Name} varchar(${4:100}) NOT NULL,',
              '    ${5:CreatedDate} datetime DEFAULT GETDATE()',
              ');'
            ].join('\n'),
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Create a new table with common structure'
          },
          {
            label: 'SELECT with JOIN',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: [
              'SELECT ${1:columns}',
              'FROM ${2:table1} t1',
              'INNER JOIN ${3:table2} t2 ON t1.${4:id} = t2.${5:foreign_key}',
              'WHERE ${6:condition};'
            ].join('\n'),
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'SELECT with INNER JOIN template'
          }
        ];

        return { suggestions };
      }
    });

    // Register hover provider for documentation
    monaco.languages.registerHoverProvider('sql', {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position);
        if (word) {
          const keyword = word.word.toUpperCase();
          const documentation = getSqlKeywordDocumentation(keyword);
          if (documentation) {
            return {
              range: new monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn
              ),
              contents: [
                { value: `**${keyword}**` },
                { value: documentation }
              ]
            };
          }
        }
        return null;
      }
    });
  }, []);

  // Get default SQL content for demonstration
  function getDefaultSqlContent() {
    return `-- Welcome to SchemaDrishti SQL Editor
-- Keyboard Shortcuts:
-- Ctrl+S: Save manually
-- Ctrl+Shift+F: Format code
-- Alt+Shift+F: Format code (alternative)
-- F5: Run SQL (coming soon)

-- This is a demo database schema for an e-commerce application
CREATE TABLE Users (
    UserID int IDENTITY(1,1) PRIMARY KEY,
    FirstName varchar(50) NOT NULL,
    LastName varchar(50) NOT NULL,
    Email varchar(100) UNIQUE NOT NULL,
    PasswordHash varchar(255) NOT NULL,
    CreatedDate datetime DEFAULT GETDATE(),
    LastLoginDate datetime,
    IsActive bit DEFAULT 1
);

CREATE TABLE Categories (
    CategoryID int IDENTITY(1,1) PRIMARY KEY,
    CategoryName varchar(100) NOT NULL,
    Description text,
    CreatedDate datetime DEFAULT GETDATE()
);

CREATE TABLE Products (
    ProductID int IDENTITY(1,1) PRIMARY KEY,
    ProductName varchar(200) NOT NULL,
    CategoryID int FOREIGN KEY REFERENCES Categories(CategoryID),
    Price decimal(10,2) NOT NULL,
    Description text,
    StockQuantity int DEFAULT 0,
    CreatedDate datetime DEFAULT GETDATE(),
    UpdatedDate datetime DEFAULT GETDATE()
);

CREATE TABLE Orders (
    OrderID int IDENTITY(1,1) PRIMARY KEY,
    UserID int FOREIGN KEY REFERENCES Users(UserID),
    OrderDate datetime DEFAULT GETDATE(),
    TotalAmount decimal(10,2) NOT NULL,
    Status varchar(20) DEFAULT 'Pending',
    ShippingAddress text NOT NULL
);

CREATE TABLE OrderItems (
    OrderItemID int IDENTITY(1,1) PRIMARY KEY,
    OrderID int FOREIGN KEY REFERENCES Orders(OrderID),
    ProductID int FOREIGN KEY REFERENCES Products(ProductID),
    Quantity int NOT NULL,
    UnitPrice decimal(10,2) NOT NULL,
    LineTotal AS (Quantity * UnitPrice)
);

-- Create some indexes for better performance
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Products_CategoryID ON Products(CategoryID);
CREATE INDEX IX_Orders_UserID ON Orders(UserID);
CREATE INDEX IX_Orders_OrderDate ON Orders(OrderDate);
CREATE INDEX IX_OrderItems_OrderID ON Orders(OrderID);
CREATE INDEX IX_OrderItems_ProductID ON OrderItems(ProductID);

-- Sample queries to test relationships
-- Try formatting this code with Ctrl+Shift+F:
SELECT u.FirstName,u.LastName,COUNT(o.OrderID) as OrderCount FROM Users u LEFT JOIN Orders o ON u.UserID=o.UserID GROUP BY u.UserID,u.FirstName,u.LastName ORDER BY OrderCount DESC;
`;
  }

  // Get documentation for SQL keywords
  function getSqlKeywordDocumentation(keyword) {
    const docs = {
      'CREATE': 'Creates a new database object (table, index, view, etc.)',
      'SELECT': 'Retrieves data from one or more tables',
      'INSERT': 'Adds new rows to a table',
      'UPDATE': 'Modifies existing rows in a table',
      'DELETE': 'Removes rows from a table',
      'PRIMARY': 'Defines a primary key constraint',
      'FOREIGN': 'Defines a foreign key constraint',
      'IDENTITY': 'Auto-incrementing column (SQL Server specific)',
      'GETDATE': 'Returns current date and time (SQL Server function)',
      'VARCHAR': 'Variable-length character string',
      'DATETIME': 'Date and time data type'
    };
    return docs[keyword];
  }

  // Handle editor theme change
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const newTheme = isDark ? EDITOR_DEFAULTS.THEME_DARK : EDITOR_DEFAULTS.THEME_LIGHT;
      monacoRef.current.editor.setTheme(newTheme);
    }
  }, [isDark]);

  return (
    <div className="sql-editor">
      <div className="sql-editor-header">
        <div className="sql-editor-title">
          <span className="editor-icon">📝</span>
          <span>SQL Editor</span>
        </div>
        <div className="sql-editor-status">
          {isLoading ? (
            <span className="loading">Loading...</span>
          ) : validationResult ? (
            <div className="validation-status">
              {validationResult.isValid ? (
                <span className="ready">✅ Valid SQL</span>
              ) : (
                <span className="error">❌ {validationResult.errors.length} Error(s)</span>
              )}
              {validationResult.warnings && validationResult.warnings.length > 0 && (
                <span className="warning">⚠️ {validationResult.warnings.length} Warning(s)</span>
              )}
            </div>
          ) : (
            <span className="ready">Ready</span>
          )}
        </div>
      </div>
      
      <div className="sql-editor-container">
        <Editor
          height="100%"
          defaultLanguage="sql"
          value={content}
          theme={isDark ? EDITOR_DEFAULTS.THEME_DARK : EDITOR_DEFAULTS.THEME_LIGHT}
          options={editorOptions}
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
          loading={
            <div className="editor-loading">
              <div className="loading-spinner"></div>
              <span>Loading Monaco Editor...</span>
            </div>
          }
        />
      </div>
      
      {/* Keyboard shortcuts help */}
      <div className="sql-editor-footer">
        <div className="keyboard-shortcuts">
          <span className="shortcut"><kbd>Ctrl</kbd>+<kbd>S</kbd> Save</span>
          <span className="shortcut"><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd> Format</span>
          <span className="shortcut"><kbd>F5</kbd> Parse</span>
          <span className="shortcut"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> Parse</span>
        </div>
      </div>
    </div>
  );
}

export default SqlEditor;