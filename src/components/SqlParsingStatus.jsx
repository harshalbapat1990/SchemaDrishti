import React from 'react';
import './SqlParsingStatus.css';

/**
 * SQL Parsing Status Component
 * Displays parsing status, statistics, and error information
 */
function SqlParsingStatus({ 
  status, 
  stats, 
  errors = [], 
  warnings = [], 
  onRetry,
  onClear,
  isCompact = false 
}) {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'PARSING':
        return <div className="status-spinner"></div>;
      case 'SUCCESS':
        return '✅';
      case 'ERROR':
      case 'PARSE_ERRORS':
        return '❌';
      case 'READY':
        return '📝';
      default:
        return '❓';
    }
  };

  const getStatusColor = () => {
    switch (status.color) {
      case 'success':
        return 'status-success';
      case 'warning':
        return 'status-warning';
      case 'error':
        return 'status-error';
      case 'info':
      default:
        return 'status-info';
    }
  };

  const formatParseTime = (time) => {
    if (time < 1000) {
      return `${time}ms`;
    } else {
      return `${(time / 1000).toFixed(1)}s`;
    }
  };

  const formatLastParsed = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  if (isCompact) {
    return (
      <div className={`sql-parsing-status compact ${getStatusColor()}`}>
        <div className="status-indicator">
          {getStatusIcon()}
        </div>
        <div className="status-message">
          {status.message}
        </div>
        {stats && stats.totalTables > 0 && (
          <div className="status-stats">
            {stats.totalTables}T • {stats.totalRelationships}R
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`sql-parsing-status ${getStatusColor()}`}>
      {/* Status Header */}
      <div className="status-header">
        <div className="status-indicator">
          {getStatusIcon()}
        </div>
        <div className="status-info">
          <div className="status-title">
            {status.status === 'PARSING' ? 'Parsing SQL' : 'SQL Parser'}
          </div>
          <div className="status-message">
            {status.message}
          </div>
        </div>
        <div className="status-actions">
          {status.status === 'ERROR' && onRetry && (
            <button 
              className="status-button retry"
              onClick={onRetry}
              title="Retry parsing"
            >
              🔄
            </button>
          )}
          {(status.status === 'SUCCESS' || status.status === 'PARSE_ERRORS') && onClear && (
            <button 
              className="status-button clear"
              onClick={onClear}
              title="Clear results"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Statistics */}
      {stats && stats.totalTables > 0 && (
        <div className="status-statistics">
          <div className="stat-grid">
            <div className="stat-item">
              <div className="stat-value">{stats.totalTables}</div>
              <div className="stat-label">Tables</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.totalColumns}</div>
              <div className="stat-label">Columns</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.totalRelationships}</div>
              <div className="stat-label">Relations</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.totalIndexes}</div>
              <div className="stat-label">Indexes</div>
            </div>
          </div>
          <div className="parse-info">
            <span className="parse-time">
              Parsed in {formatParseTime(stats.parseTime)}
            </span>
            <span className="parse-timestamp">
              {formatLastParsed(stats.lastParsed)}
            </span>
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="status-errors">
          <div className="errors-header">
            <span className="errors-title">
              ❌ {errors.length} Error{errors.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="errors-list">
            {errors.slice(0, 5).map((error, index) => (
              <div key={index} className="error-item">
                <div className="error-type">{error.type}</div>
                <div className="error-message">{error.message}</div>
                {error.tableName && (
                  <div className="error-context">Table: {error.tableName}</div>
                )}
              </div>
            ))}
            {errors.length > 5 && (
              <div className="error-item more-errors">
                ... and {errors.length - 5} more error{errors.length - 5 !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="status-warnings">
          <div className="warnings-header">
            <span className="warnings-title">
              ⚠️ {warnings.length} Warning{warnings.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="warnings-list">
            {warnings.slice(0, 3).map((warning, index) => (
              <div key={index} className="warning-item">
                <div className="warning-message">{warning.message}</div>
              </div>
            ))}
            {warnings.length > 3 && (
              <div className="warning-item more-warnings">
                ... and {warnings.length - 3} more warning{warnings.length - 3 !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ready State Help */}
      {status.status === 'READY' && (
        <div className="status-help">
          <div className="help-content">
            <div className="help-icon">💡</div>
            <div className="help-text">
              <div>Start typing SQL CREATE TABLE statements to see your database schema visualized</div>
              <div className="help-examples">
                <strong>Example:</strong> CREATE TABLE Users (ID int PRIMARY KEY, Name varchar(100))
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SqlParsingStatus;