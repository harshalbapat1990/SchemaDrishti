// Regular expressions and patterns for SQL parsing
export const SQL_KEYWORDS = {
  // DDL Keywords
  CREATE: /\bCREATE\s+(TABLE|VIEW|INDEX|PROCEDURE|FUNCTION|TRIGGER|DATABASE|SCHEMA)\b/gi,
  ALTER: /\bALTER\s+(TABLE|VIEW|INDEX|PROCEDURE|FUNCTION|DATABASE|SCHEMA)\b/gi,
  DROP: /\bDROP\s+(TABLE|VIEW|INDEX|PROCEDURE|FUNCTION|TRIGGER|DATABASE|SCHEMA)\b/gi,
  
  // Table operations
  CREATE_TABLE: /\bCREATE\s+TABLE\s+(\[?[\w\d_]+\]?)\s*\(/gi,
  ALTER_TABLE: /\bALTER\s+TABLE\s+(\[?[\w\d_]+\]?)/gi,
  DROP_TABLE: /\bDROP\s+TABLE\s+(\[?[\w\d_]+\]?)/gi,
  
  // Constraints
  PRIMARY_KEY: /\bPRIMARY\s+KEY\b/gi,
  FOREIGN_KEY: /\bFOREIGN\s+KEY\b/gi,
  REFERENCES: /\bREFERENCES\s+(\[?[\w\d_]+\]?)\s*\((\[?[\w\d_]+\]?)\)/gi,
  UNIQUE: /\bUNIQUE\b/gi,
  NOT_NULL: /\bNOT\s+NULL\b/gi,
  CHECK: /\bCHECK\s*\(/gi,
  DEFAULT: /\bDEFAULT\s+(.+?)(?=,|\)|$)/gi,
  
  // Data types
  DATA_TYPES: /\b(INT|INTEGER|BIGINT|SMALLINT|TINYINT|BIT|DECIMAL|NUMERIC|FLOAT|REAL|MONEY|SMALLMONEY|VARCHAR|NVARCHAR|CHAR|NCHAR|TEXT|NTEXT|DATETIME|DATETIME2|SMALLDATETIME|DATE|TIME|TIMESTAMP|BINARY|VARBINARY|IMAGE|UNIQUEIDENTIFIER|XML|GEOGRAPHY|GEOMETRY)\b/gi,
  
  // SQL Server specific
  IDENTITY: /\bIDENTITY\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/gi,
  GETDATE: /\bGETDATE\s*\(\s*\)/gi,
  NEWID: /\bNEWID\s*\(\s*\)/gi
};

// Table parsing patterns
export const TABLE_PATTERNS = {
  // Match CREATE TABLE statement - Fixed to not be greedy across multiple tables
  CREATE_TABLE_FULL: /CREATE\s+TABLE\s+(\[?[\w\d_]+\]?)\s*\(\s*((?:[^()]+|\([^)]*\))*?)\s*\)\s*;?/gim,
  
  // Match column definitions - More flexible
  COLUMN_DEFINITION: /^\s*(\[?[\w\d_]+\]?)\s+([\w\d_()]+(?:\s*\(\s*\d+(?:\s*,\s*\d+)?\s*\))?)\s*(.*?)$/gim,
  
  // Match constraints
  CONSTRAINT_DEFINITION: /^\s*CONSTRAINT\s+(\[?[\w\d_]+\]?)\s+(PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK)\s*(.*?)$/gim,
  
  // Match inline constraints
  PRIMARY_KEY_INLINE: /\bPRIMARY\s+KEY\b/gi,
  FOREIGN_KEY_INLINE: /\bREFERENCES\s+(\[?[\w\d_]+\]?)\s*\((\[?[\w\d_]+\]?)\)/gi,
  UNIQUE_INLINE: /\bUNIQUE\b/gi,
  
  // Match references
  REFERENCES_PATTERN: /\bREFERENCES\s+(\[?[\w\d_]+\]?)\s*\((\[?[\w\d_]+\]?)\)/gi,
  
  // Match separate FOREIGN KEY constraints
  FOREIGN_KEY_CONSTRAINT: /FOREIGN\s+KEY\s*\(\s*(\[?[\w\d_]+\]?)\s*\)\s+REFERENCES\s+(\[?[\w\d_]+\]?)\s*\(\s*(\[?[\w\d_]+\]?)\s*\)/gi
};

// Index patterns
export const INDEX_PATTERNS = {
  CREATE_INDEX: /CREATE\s+(UNIQUE\s+)?INDEX\s+(\[?[\w\d_]+\]?)\s+ON\s+(\[?[\w\d_]+\]?)\s*\(\s*([^)]+)\s*\)/gi
};

// Comment patterns
export const COMMENT_PATTERNS = {
  SINGLE_LINE: /--.*$/gm,
  MULTI_LINE: /\/\*[\s\S]*?\*\//g,
  BLOCK_COMMENT: /\/\*[\s\S]*?\*\//g
};

// SQL Server data type mappings
export const DATA_TYPE_MAPPINGS = {
  // Numeric types
  'INT': { type: 'number', size: 4, category: 'integer' },
  'INTEGER': { type: 'number', size: 4, category: 'integer' },
  'BIGINT': { type: 'number', size: 8, category: 'integer' },
  'SMALLINT': { type: 'number', size: 2, category: 'integer' },
  'TINYINT': { type: 'number', size: 1, category: 'integer' },
  'BIT': { type: 'boolean', size: 1, category: 'boolean' },
  'DECIMAL': { type: 'number', size: null, category: 'decimal' },
  'NUMERIC': { type: 'number', size: null, category: 'decimal' },
  'FLOAT': { type: 'number', size: 8, category: 'float' },
  'REAL': { type: 'number', size: 4, category: 'float' },
  'MONEY': { type: 'number', size: 8, category: 'money' },
  'SMALLMONEY': { type: 'number', size: 4, category: 'money' },
  
  // String types
  'VARCHAR': { type: 'string', size: null, category: 'varchar' },
  'NVARCHAR': { type: 'string', size: null, category: 'varchar' },
  'CHAR': { type: 'string', size: null, category: 'char' },
  'NCHAR': { type: 'string', size: null, category: 'char' },
  'TEXT': { type: 'string', size: null, category: 'text' },
  'NTEXT': { type: 'string', size: null, category: 'text' },
  
  // Date types
  'DATETIME': { type: 'date', size: 8, category: 'datetime' },
  'DATETIME2': { type: 'date', size: null, category: 'datetime' },
  'SMALLDATETIME': { type: 'date', size: 4, category: 'datetime' },
  'DATE': { type: 'date', size: 3, category: 'date' },
  'TIME': { type: 'time', size: null, category: 'time' },
  'TIMESTAMP': { type: 'binary', size: 8, category: 'timestamp' },
  
  // Binary types
  'BINARY': { type: 'binary', size: null, category: 'binary' },
  'VARBINARY': { type: 'binary', size: null, category: 'binary' },
  'IMAGE': { type: 'binary', size: null, category: 'binary' },
  
  // Special types
  'UNIQUEIDENTIFIER': { type: 'guid', size: 16, category: 'guid' },
  'XML': { type: 'xml', size: null, category: 'xml' },
  'GEOGRAPHY': { type: 'spatial', size: null, category: 'spatial' },
  'GEOMETRY': { type: 'spatial', size: null, category: 'spatial' }
};

// Parsing error types
export const PARSING_ERROR_TYPES = {
  SYNTAX_ERROR: 'SYNTAX_ERROR',
  DUPLICATE_TABLE: 'DUPLICATE_TABLE',
  DUPLICATE_COLUMN: 'DUPLICATE_COLUMN', 
  INVALID_COLUMN_DEFINITION: 'INVALID_COLUMN_DEFINITION',
  INVALID_TABLE_NAME: 'INVALID_TABLE_NAME',
  MISSING_REFERENCE: 'MISSING_REFERENCE',
  INVALID_CONSTRAINT: 'INVALID_CONSTRAINT',
  MISSING_COLUMN: 'MISSING_COLUMN',
  UNKNOWN_CONSTRAINT: 'UNKNOWN_CONSTRAINT'
};

// Validation rules
export const VALIDATION_RULES = {
  TABLE_NAME: /^[a-zA-Z_][\w_]*$/,
  COLUMN_NAME: /^[a-zA-Z_][\w_]*$/,
  MAX_TABLE_NAME_LENGTH: 128,
  MAX_COLUMN_NAME_LENGTH: 128,
  MAX_TABLES_PER_SCHEMA: 100
};