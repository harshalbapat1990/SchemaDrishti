/**
 * Debounce function to limit the rate of function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get value from localStorage with fallback
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Stored value or default
 */
export function getStorageValue(key, defaultValue) {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Set value in localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 */
export function setStorageValue(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error writing localStorage key "${key}":`, error);
  }
}

/**
 * Generate unique ID
 * @returns {string} Unique identifier
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Check if string is empty or whitespace
 * @param {string} str - String to check
 * @returns {boolean} True if empty or whitespace
 */
export function isEmpty(str) {
  return !str || str.trim().length === 0;
}

/**
 * Validate SQL content before parsing
 * @param {string} sqlContent - SQL content to validate
 * @returns {Object} Validation result
 */
export function validateSqlContent(sqlContent) {
  const errors = [];
  const warnings = [];

  // Check content length
  if (!sqlContent || sqlContent.trim().length === 0) {
    errors.push('SQL content is empty');
    return { isValid: false, errors, warnings };
  }

  if (sqlContent.length > PARSING_CONSTANTS.MAX_SQL_LENGTH) {
    errors.push(`SQL content exceeds maximum length of ${PARSING_CONSTANTS.MAX_SQL_LENGTH} characters`);
  }

  // Check for basic SQL syntax indicators
  const hasCreateTable = /CREATE\s+TABLE/i.test(sqlContent);
  const hasAlterTable = /ALTER\s+TABLE/i.test(sqlContent);
  const hasDropTable = /DROP\s+TABLE/i.test(sqlContent);

  if (!hasCreateTable && !hasAlterTable && !hasDropTable) {
    warnings.push('No DDL statements (CREATE, ALTER, DROP) found. Parser expects DDL for schema generation.');
  }

  // Check for potentially problematic content
  const hasSelectStatements = /SELECT\s+/i.test(sqlContent);
  const hasInsertStatements = /INSERT\s+/i.test(sqlContent);
  
  if (hasSelectStatements || hasInsertStatements) {
    warnings.push('DML statements (SELECT, INSERT, etc.) found. Parser focuses on DDL for schema generation.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasCreateTable,
    statementCount: sqlContent.split(';').filter(s => s.trim()).length
  };
}

/**
 * Format parsing errors for display
 * @param {Array} errors - Array of parsing errors
 * @returns {Array} Formatted errors
 */
export function formatParsingErrors(errors) {
  return errors.map(error => ({
    ...error,
    severity: getErrorSeverity(error.type),
    suggestion: getErrorSuggestion(error.type),
    formattedMessage: formatErrorMessage(error)
  }));
}

/**
 * Get error severity level
 * @param {string} errorType - Error type
 * @returns {string} Severity level
 */
function getErrorSeverity(errorType) {
  const severityMap = {
    'SYNTAX_ERROR': 'HIGH',
    'INVALID_TABLE_NAME': 'MEDIUM',
    'INVALID_COLUMN_DEFINITION': 'MEDIUM',
    'INVALID_CONSTRAINT': 'MEDIUM',
    'MISSING_REFERENCE': 'LOW',
    'DUPLICATE_TABLE': 'HIGH',
    'DUPLICATE_COLUMN': 'HIGH',
    'UNKNOWN_DATA_TYPE': 'LOW'
  };
  
  return severityMap[errorType] || 'MEDIUM';
}

/**
 * Get error suggestion
 * @param {string} errorType - Error type
 * @returns {string} Suggestion text
 */
function getErrorSuggestion(errorType) {
  const suggestionMap = {
    'SYNTAX_ERROR': 'Check SQL syntax and ensure proper statement termination',
    'INVALID_TABLE_NAME': 'Table names must start with a letter and contain only letters, numbers, and underscores',
    'INVALID_COLUMN_DEFINITION': 'Check column syntax: ColumnName DataType [NULL|NOT NULL] [DEFAULT value]',
    'INVALID_CONSTRAINT': 'Review constraint syntax for PRIMARY KEY, FOREIGN KEY, UNIQUE, or CHECK',
    'MISSING_REFERENCE': 'Ensure referenced table exists in the schema',
    'DUPLICATE_TABLE': 'Remove duplicate CREATE TABLE statements',
    'DUPLICATE_COLUMN': 'Ensure column names are unique within each table',
    'UNKNOWN_DATA_TYPE': 'Use standard SQL Server data types (INT, VARCHAR, DATETIME, etc.)'
  };
  
  return suggestionMap[errorType] || 'Review the SQL statement syntax';
}

/**
 * Format error message for display
 * @param {Object} error - Error object
 * @returns {string} Formatted message
 */
function formatErrorMessage(error) {
  let message = error.message;
  
  if (error.tableName) {
    message += ` (Table: ${error.tableName})`;
  }
  
  if (error.line && error.column) {
    message += ` at line ${error.line}, column ${error.column}`;
  }
  
  return message;
}

/**
 * Calculate parsing performance metrics
 * @param {Object} parseResult - Parse result
 * @returns {Object} Performance metrics
 */
export function calculateParsingMetrics(parseResult) {
  const metrics = {
    parseTime: parseResult.stats.parseTime || 0,
    schemaComplexity: 'LOW',
    errorRate: 0,
    warningRate: 0,
    performanceScore: 100
  };

  // Calculate schema complexity
  const totalTables = parseResult.stats.totalTables || 0;
  const totalRelationships = parseResult.stats.totalRelationships || 0;
  const totalColumns = parseResult.stats.totalColumns || 0;
  
  if (totalTables > 50 || totalRelationships > 100 || totalColumns > 500) {
    metrics.schemaComplexity = 'HIGH';
  } else if (totalTables > 20 || totalRelationships > 30 || totalColumns > 150) {
    metrics.schemaComplexity = 'MEDIUM';
  }

  // Calculate error rates
  if (parseResult.errors && parseResult.errors.length > 0) {
    metrics.errorRate = (parseResult.errors.length / Math.max(totalTables, 1)) * 100;
  }
  
  if (parseResult.warnings && parseResult.warnings.length > 0) {
    metrics.warningRate = (parseResult.warnings.length / Math.max(totalTables, 1)) * 100;
  }

  // Calculate performance score
  let score = 100;
  
  if (metrics.parseTime > PERFORMANCE_CONSTANTS.SLOW_PARSE_THRESHOLD) {
    score -= 20;
  }
  
  if (metrics.errorRate > 0) {
    score -= Math.min(metrics.errorRate * 2, 30);
  }
  
  if (metrics.warningRate > 10) {
    score -= Math.min(metrics.warningRate, 20);
  }
  
  metrics.performanceScore = Math.max(score, 0);

  return metrics;
}

/**
 * Generate parsing summary for display
 * @param {Object} parseResult - Parse result
 * @returns {Object} Summary object
 */
export function generateParsingSummary(parseResult) {
  const metrics = calculateParsingMetrics(parseResult);
  
  return {
    success: parseResult.success,
    stats: parseResult.stats,
    metrics,
    summary: {
      totalEntities: parseResult.stats.totalTables + parseResult.stats.totalIndexes,
      complexityLevel: metrics.schemaComplexity,
      qualityScore: metrics.performanceScore,
      hasErrors: parseResult.errors && parseResult.errors.length > 0,
      hasWarnings: parseResult.warnings && parseResult.warnings.length > 0
    }
  };
}

/**
 * Export parsing results to different formats
 * @param {Object} astResult - AST processing result
 * @param {string} format - Export format
 * @returns {string|Object} Exported data
 */
export function exportParsingResults(astResult, format = 'JSON') {
  if (!astResult || !astResult.success) {
    throw new Error('No valid parsing results to export');
  }

  switch (format.toUpperCase()) {
    case 'JSON':
      return JSON.stringify(astResult, null, 2);
      
    case 'MERMAID':
      return generateMermaidERD(astResult.diagramData);
      
    case 'SQL_SUMMARY':
      return generateSqlSummary(astResult);
      
    case 'CSV':
      return generateCsvSummary(astResult);
      
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Generate Mermaid ERD syntax
 * @param {Object} diagramData - Diagram data
 * @returns {string} Mermaid ERD syntax
 */
function generateMermaidERD(diagramData) {
  if (!diagramData) {
    return '%%{init: {"er": {"fontSize": 12}}}%%\nerDiagram\n    %% No data to display';
  }

  let mermaid = '%%{init: {"er": {"fontSize": 12}}}%%\n';
  mermaid += 'erDiagram\n';
  
  // Add entities
  for (const entity of diagramData.entities) {
    mermaid += `    ${entity.name} {\n`;
    for (const column of entity.columns) {
      const keyIndicator = column.key ? ` ${column.key}` : '';
      const nullable = column.nullable ? '' : ' "NOT NULL"';
      mermaid += `        ${column.type} ${column.name}${keyIndicator}${nullable}\n`;
    }
    mermaid += '    }\n';
  }
  
  // Add relationships
  for (const rel of diagramData.relationships) {
    const cardinalityMap = {
      'ONE_TO_ONE': '||--||',
      'ONE_TO_MANY': '||--o{',
      'MANY_TO_ONE': '}o--||',
      'MANY_TO_MANY': '}o--o{'
    };
    const connector = cardinalityMap[rel.type] || '||--||';
    mermaid += `    ${rel.from} ${connector} ${rel.to} : "${rel.label || 'relates to'}"\n`;
  }
  
  return mermaid;
}

/**
 * Generate SQL summary report
 * @param {Object} astResult - AST result
 * @returns {string} Summary report
 */
function generateSqlSummary(astResult) {
  let summary = '-- SQL Schema Summary Report\n';
  summary += `-- Generated: ${new Date().toISOString()}\n\n`;
  
  summary += `-- Statistics:\n`;
  summary += `-- Tables: ${Object.keys(astResult.tables).length}\n`;
  summary += `-- Relationships: ${astResult.relationships.length}\n\n`;
  
  for (const [tableName, table] of Object.entries(astResult.tables)) {
    summary += `-- Table: ${tableName}\n`;
    summary += `--   Columns: ${table.columns.size}\n`;
    summary += `--   Primary Keys: ${table.primaryKeys.length}\n`;
    summary += `--   Foreign Keys: ${table.foreignKeys.length}\n`;
    summary += `--   Indexes: ${table.indexes.length}\n\n`;
  }
  
  return summary;
}

/**
 * Generate CSV summary
 * @param {Object} astResult - AST result
 * @returns {string} CSV data
 */
function generateCsvSummary(astResult) {
  let csv = 'Table,Column,DataType,Key,Nullable,Default\n';
  
  for (const [tableName, table] of Object.entries(astResult.tables)) {
    for (const [columnName, column] of table.columns) {
      const keyType = column.isPrimaryKey ? 'PK' : column.isForeignKey ? 'FK' : column.isUnique ? 'UQ' : '';
      const nullable = column.isNullable ? 'YES' : 'NO';
      const defaultValue = column.defaultValue || '';
      
      csv += `"${tableName}","${columnName}","${column.dataType.fullType}","${keyType}","${nullable}","${defaultValue}"\n`;
    }
  }
  
  return csv;
}

// Add these imports to the existing constants
import { PARSING_CONSTANTS, PERFORMANCE_CONSTANTS } from './constants';