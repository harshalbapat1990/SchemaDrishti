import { 
  SQL_KEYWORDS, 
  TABLE_PATTERNS, 
  INDEX_PATTERNS, 
  COMMENT_PATTERNS, 
  DATA_TYPE_MAPPINGS,
  PARSING_ERROR_TYPES,
  VALIDATION_RULES 
} from '../utils/sqlPatterns';

/**
 * SQL Parser Service
 * Parses SQL DDL statements and extracts database schema information
 */
export class SqlParser {
  constructor() {
    this.reset();
  }

  /**
   * Reset parser state
   */
  reset() {
    this.tables = new Map();
    this.indexes = new Map();
    this.relationships = [];
    this.errors = [];
    this.warnings = [];
    this.parseStats = {
      totalTables: 0,
      totalColumns: 0,
      totalRelationships: 0,
      totalIndexes: 0,
      parseTime: 0
    };
  }

  /**
   * Parse SQL content and extract schema information
   * @param {string} sqlContent - Raw SQL content
   * @returns {Object} Parsed schema information
   */
  async parse(sqlContent) {
    const startTime = performance.now();
    
    try {
      this.reset();
      
      if (!sqlContent || typeof sqlContent !== 'string') {
        throw new Error('Invalid SQL content provided');
      }

      // Clean and prepare SQL content
      const cleanedSql = this.preprocessSql(sqlContent);
      
      // Extract different types of statements
      await this.extractTables(cleanedSql);
      await this.extractIndexes(cleanedSql);
      await this.extractRelationships();
      
      // Validate the parsed schema
      this.validateSchema();
      
      // Calculate parse statistics
      this.calculateStats();
      
      const endTime = performance.now();
      this.parseStats.parseTime = Math.round(endTime - startTime);
      
      return this.getParseResult();
      
    } catch (error) {
      this.errors.push({
        type: PARSING_ERROR_TYPES.SYNTAX_ERROR,
        message: error.message,
        line: 0,
        column: 0
      });
      
      return this.getParseResult();
    }
  }

  /**
   * Preprocess SQL content by removing comments and normalizing whitespace
   * @param {string} sql - Raw SQL content
   * @returns {string} Cleaned SQL content
   */
  preprocessSql(sql) {
    if (!sql || typeof sql !== 'string') {
      return '';
    }

    try {
      // Remove comments but keep line numbers for error reporting
      const cleaned = sql
        .replace(COMMENT_PATTERNS.MULTI_LINE, ' ')
        .replace(COMMENT_PATTERNS.SINGLE_LINE, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      return cleaned;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error preprocessing SQL:', error);
      return sql; // Return original if preprocessing fails
    }
  }

  /**
   * Extract table definitions from SQL - Enhanced
   * @param {string} sql - Cleaned SQL content
   */
  async extractTables(sql) {
    if (!sql) return;

    // eslint-disable-next-line no-console
    console.log('Starting extractTables with SQL:', sql.substring(0, 200) + '...');
    
    // Split SQL by semicolons first to separate statements
    const statements = sql.split(';').map(stmt => stmt.trim()).filter(stmt => stmt);
    
    // eslint-disable-next-line no-console
    console.log('Split into statements:', statements.length);
    
    for (const statement of statements) {
      if (!statement.toUpperCase().includes('CREATE TABLE')) continue;
      
      const tableMatch = statement.match(/CREATE\s+TABLE\s+(\[?[\w\d_]+\]?)\s*\(\s*([\s\S]*?)\s*\)$/i);
      
      if (!tableMatch) {
        // eslint-disable-next-line no-console
        console.log('Failed to match CREATE TABLE in statement:', statement);
        continue;
      }
      
      try {
        const tableName = this.cleanIdentifier(tableMatch[1]);
        const tableContent = tableMatch[2] || '';
        
        // eslint-disable-next-line no-console
        console.log('Processing table:', tableName, 'Content:', tableContent);
        
        if (this.tables.has(tableName)) {
          this.errors.push({
            type: PARSING_ERROR_TYPES.DUPLICATE_TABLE,
            message: `Duplicate table definition: ${tableName}`,
            tableName
          });
          continue;
        }

        const table = {
          name: tableName,
          columns: new Map(),
          constraints: [],
          indexes: [],
          relationships: []
        };

        // Parse columns and constraints
        await this.parseTableContent(table, tableContent);
        
        this.tables.set(tableName, table);
        this.parseStats.totalTables++;
        
        // eslint-disable-next-line no-console
        console.log('Successfully processed table:', tableName, 'with', table.columns.size, 'columns');
        
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error processing table:', error);
        this.errors.push({
          type: PARSING_ERROR_TYPES.SYNTAX_ERROR,
          message: `Error processing table: ${error.message}`,
          tableName: tableMatch[1] || 'unknown'
        });
      }
    }
  }

  /**
   * Parse table content (columns and constraints) - Enhanced with better logic
   * @param {Object} table - Table object
   * @param {string} content - Table content string
   */
  async parseTableContent(table, content) {
    if (!content || typeof content !== 'string') {
      // eslint-disable-next-line no-console
      console.warn('parseTableContent received invalid content:', content);
      return;
    }

    // eslint-disable-next-line no-console
    console.log('Parsing table content for', table.name, ':', content);

    // Split content by commas, but be careful with nested parentheses
    const parts = this.splitTableContent(content);
    
    // eslint-disable-next-line no-console
    console.log('Split table content into parts:', parts);

    for (const part of parts) {
      const trimmedPart = part.trim();
      if (!trimmedPart) continue;

      // eslint-disable-next-line no-console
      console.log('Processing part:', trimmedPart);

      try {
        const upperPart = trimmedPart.toUpperCase();
        
        // Check if it's a standalone constraint definition
        if (upperPart.startsWith('CONSTRAINT') || 
            upperPart.startsWith('FOREIGN KEY') ||
            upperPart.startsWith('PRIMARY KEY') ||
            upperPart.startsWith('UNIQUE') ||
            upperPart.startsWith('CHECK')) {
          await this.parseConstraintDefinition(table, trimmedPart);
        } else {
          // It's a column definition - parse it normally
          await this.parseColumnDefinition(table, trimmedPart);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error parsing table part:', trimmedPart, error);
        this.errors.push({
          type: PARSING_ERROR_TYPES.SYNTAX_ERROR,
          message: `Error parsing table content: ${error.message}`,
          tableName: table.name
        });
      }
    }
  }

  /**
   * Split table content by commas, handling nested parentheses
   * @param {string} content - Table content
   * @returns {Array} Array of content parts
   */
  splitTableContent(content) {
    const parts = [];
    let current = '';
    let parenthesesLevel = 0;
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < content.length; i++) {
      const char = content[i];

      // Handle quotes
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
        current += char;
      } else if (inQuotes) {
        current += char;
      } else if (char === '(') {
        parenthesesLevel++;
        current += char;
      } else if (char === ')') {
        parenthesesLevel--;
        current += char;
      } else if (char === ',' && parenthesesLevel === 0) {
        // This is a top-level comma, split here
        if (current.trim()) {
          parts.push(current.trim());
        }
        current = '';
      } else {
        current += char;
      }
    }

    // Add the last part
    if (current.trim()) {
      parts.push(current.trim());
    }

    return parts;
  }

  /**
   * Parse column definition - Fixed logic
   * @param {Object} table - Table object
   * @param {string} definition - Column definition string
   */
  async parseColumnDefinition(table, definition) {
    if (!definition || typeof definition !== 'string') {
      // eslint-disable-next-line no-console
      console.warn('parseColumnDefinition received invalid definition:', definition);
      return;
    }

    // eslint-disable-next-line no-console
    console.log('Parsing column definition:', definition);

    // Skip if this is a FOREIGN KEY constraint (should be handled by parseConstraintDefinition)
    if (definition.toUpperCase().trim().startsWith('FOREIGN KEY')) {
      // eslint-disable-next-line no-console
      console.log('Skipping FOREIGN KEY constraint in parseColumnDefinition');
      return;
    }

    // More flexible column pattern matching
    const columnMatch = definition.match(/^\s*(\[?[\w\d_]+\]?)\s+([\w\d_()]+(?:\s*\(\s*\d+(?:\s*,\s*\d+)?\s*\))?)\s*(.*?)$/i);
    
    if (!columnMatch) {
      // eslint-disable-next-line no-console
      console.log('Failed to match column definition:', definition);
      this.errors.push({
        type: PARSING_ERROR_TYPES.INVALID_COLUMN_DEFINITION,
        message: `Invalid column definition: ${definition}`,
        tableName: table.name
      });
      return;
    }

    const columnName = this.cleanIdentifier(columnMatch[1]);
    const dataType = columnMatch[2] ? columnMatch[2].toUpperCase() : '';
    const attributes = columnMatch[3] || '';

    // eslint-disable-next-line no-console
    console.log('Parsed column parts:', { columnName, dataType, attributes });

    // Validate column name
    if (!columnName) {
      this.errors.push({
        type: PARSING_ERROR_TYPES.INVALID_COLUMN_DEFINITION,
        message: `Empty column name in: ${definition}`,
        tableName: table.name
      });
      return;
    }

    // Check for duplicate column
    if (table.columns.has(columnName)) {
      this.errors.push({
        type: PARSING_ERROR_TYPES.DUPLICATE_COLUMN,
        message: `Duplicate column: ${columnName}`,
        tableName: table.name
      });
      return;
    }

    const column = {
      name: columnName,
      dataType: this.parseDataType(dataType),
      isNullable: !attributes.toUpperCase().includes('NOT NULL'),
      isPrimaryKey: attributes.toUpperCase().includes('PRIMARY KEY'),
      isForeignKey: false,
      isUnique: attributes.toUpperCase().includes('UNIQUE'),
      isIdentity: false,
      defaultValue: null,
      references: null
    };

    // If it's a primary key, make it not nullable
    if (column.isPrimaryKey) {
      column.isNullable = false;
    }

    // Parse additional attributes
    await this.parseColumnAttributes(column, attributes, table);
    
    table.columns.set(columnName, column);
    this.parseStats.totalColumns++;
    
    // eslint-disable-next-line no-console
    console.log('Successfully parsed column:', columnName, column);
  }

  /**
   * Parse column attributes (IDENTITY, DEFAULT, etc.) - Now as class method
   * @param {Object} column - Column object
   * @param {string} attributes - Attributes string
   * @param {Object} _table - Table object (for context) - prefixed with _ to indicate unused
   */
  async parseColumnAttributes(column, attributes, _table) {
    if (!attributes || typeof attributes !== 'string') {
      return;
    }

    // Check for PRIMARY KEY
    if (TABLE_PATTERNS.PRIMARY_KEY_INLINE && TABLE_PATTERNS.PRIMARY_KEY_INLINE.test(attributes)) {
      column.isPrimaryKey = true;
      column.isNullable = false; // Primary keys cannot be null
    }

    // Check for IDENTITY
    if (SQL_KEYWORDS.IDENTITY) {
      const identityMatch = attributes.match(SQL_KEYWORDS.IDENTITY);
      if (identityMatch) {
        column.isIdentity = true;
        column.identitySeed = parseInt(identityMatch[1] || '1', 10);
        column.identityIncrement = parseInt(identityMatch[2] || '1', 10);
      }
    }

    // Check for DEFAULT
    if (SQL_KEYWORDS.DEFAULT) {
      const defaultMatch = attributes.match(SQL_KEYWORDS.DEFAULT);
      if (defaultMatch) {
        column.defaultValue = defaultMatch[1] ? defaultMatch[1].trim() : null;
      }
    }

    // Check for FOREIGN KEY REFERENCES
    if (TABLE_PATTERNS.FOREIGN_KEY_INLINE) {
      const foreignKeyMatch = attributes.match(TABLE_PATTERNS.FOREIGN_KEY_INLINE);
      if (foreignKeyMatch) {
        column.isForeignKey = true;
        column.references = {
          table: this.cleanIdentifier(foreignKeyMatch[1]),
          column: this.cleanIdentifier(foreignKeyMatch[2])
        };
      }
    }
  }

  /**
   * Parse constraint definition - Now with full implementation
   * @param {Object} table - Table object  
   * @param {string} definition - Constraint definition
   */
  async parseConstraintDefinition(table, definition) {
    // eslint-disable-next-line no-console
    console.log('Parsing constraint:', definition);
    
    const upperDef = definition.toUpperCase().trim();
    
    // Handle FOREIGN KEY constraints
    if (upperDef.includes('FOREIGN KEY')) {
      await this.parseForeignKeyConstraint(table, definition);
      return;
    }
    
    // Handle PRIMARY KEY constraints
    if (upperDef.includes('PRIMARY KEY')) {
      await this.parsePrimaryKeyConstraint(table, definition);
      return;
    }
    
    // Handle UNIQUE constraints
    if (upperDef.includes('UNIQUE')) {
      await this.parseUniqueConstraint(table, definition);
      return;
    }
    
    // Handle CHECK constraints
    if (upperDef.includes('CHECK')) {
      await this.parseCheckConstraint(table, definition);
      return;
    }
    
    // Unknown constraint type
    this.warnings.push({
      type: 'UNKNOWN_CONSTRAINT',
      message: `Unknown constraint type: ${definition}`,
      tableName: table.name
    });
  }

  /**
   * Parse FOREIGN KEY constraint - Full implementation
   * @param {Object} table - Table object
   * @param {string} definition - Foreign key definition
   */
  async parseForeignKeyConstraint(table, definition) {
    // eslint-disable-next-line no-console
    console.log('Parsing foreign key constraint:', definition);
    
    // Pattern to match FOREIGN KEY (column) REFERENCES table(column)
    const foreignKeyPattern = /FOREIGN\s+KEY\s*\(\s*(\[?[\w\d_]+\]?)\s*\)\s+REFERENCES\s+(\[?[\w\d_]+\]?)\s*\(\s*(\[?[\w\d_]+\]?)\s*\)/gi;
    
    const match = foreignKeyPattern.exec(definition);
    
    if (!match) {
      this.errors.push({
        type: PARSING_ERROR_TYPES.INVALID_CONSTRAINT,
        message: `Invalid FOREIGN KEY syntax: ${definition}`,
        tableName: table.name
      });
      return;
    }
    
    const columnName = this.cleanIdentifier(match[1]);
    const referencedTable = this.cleanIdentifier(match[2]);
    const referencedColumn = this.cleanIdentifier(match[3]);
    
    // eslint-disable-next-line no-console
    console.log('Parsed FK:', { columnName, referencedTable, referencedColumn });
    
    // Find the column in the current table and mark it as foreign key
    if (table.columns.has(columnName)) {
      const column = table.columns.get(columnName);
      column.isForeignKey = true;
      column.references = {
        table: referencedTable,
        column: referencedColumn
      };
      
      // eslint-disable-next-line no-console
      console.log('Marked column as FK:', columnName, '->', `${referencedTable}.${referencedColumn}`);
    } else {
      this.errors.push({
        type: PARSING_ERROR_TYPES.MISSING_COLUMN,
        message: `Foreign key column '${columnName}' not found in table '${table.name}'`,
        tableName: table.name
      });
    }
    
    // Add constraint to table
    const constraint = {
      type: 'FOREIGN_KEY',
      name: `FK_${table.name}_${columnName}`, // Generate constraint name
      columnName,
      referencedTable,
      referencedColumn
    };
    
    table.constraints.push(constraint);
  }

  /**
   * Parse PRIMARY KEY constraint - New implementation
   * @param {Object} table - Table object
   * @param {string} definition - Primary key definition
   */
  async parsePrimaryKeyConstraint(table, definition) {
    // eslint-disable-next-line no-console
    console.log('Parsing primary key constraint:', definition);
    
    // Pattern to match PRIMARY KEY (column1, column2, ...)
    const primaryKeyPattern = /PRIMARY\s+KEY\s*\(\s*(.*?)\s*\)/gi;
    
    const match = primaryKeyPattern.exec(definition);
    
    if (!match) {
      this.errors.push({
        type: PARSING_ERROR_TYPES.INVALID_CONSTRAINT,
        message: `Invalid PRIMARY KEY syntax: ${definition}`,
        tableName: table.name
      });
      return;
    }
    
    const columnsList = match[1];
    const columns = columnsList.split(',').map(col => this.cleanIdentifier(col.trim()));
    
    // Mark columns as primary key
    for (const columnName of columns) {
      if (table.columns.has(columnName)) {
        const column = table.columns.get(columnName);
        column.isPrimaryKey = true;
        column.isNullable = false; // Primary keys cannot be null
      } else {
        this.errors.push({
          type: PARSING_ERROR_TYPES.MISSING_COLUMN,
          message: `Primary key column '${columnName}' not found in table '${table.name}'`,
          tableName: table.name
        });
      }
    }
    
    // Add constraint to table
    const constraint = {
      type: 'PRIMARY_KEY',
      name: `PK_${table.name}`,
      columns
    };
    
    table.constraints.push(constraint);
  }

  /**
   * Parse UNIQUE constraint - New implementation
   * @param {Object} table - Table object
   * @param {string} definition - Unique constraint definition
   */
  async parseUniqueConstraint(table, definition) {
    // eslint-disable-next-line no-console
    console.log('Parsing unique constraint:', definition);
    
    // Pattern to match UNIQUE (column1, column2, ...)
    const uniquePattern = /UNIQUE\s*\(\s*(.*?)\s*\)/gi;
    
    const match = uniquePattern.exec(definition);
    
    if (!match) {
      this.errors.push({
        type: PARSING_ERROR_TYPES.INVALID_CONSTRAINT,
        message: `Invalid UNIQUE syntax: ${definition}`,
        tableName: table.name
      });
      return;
    }
    
    const columnsList = match[1];
    const columns = columnsList.split(',').map(col => this.cleanIdentifier(col.trim()));
    
    // Mark columns as unique
    for (const columnName of columns) {
      if (table.columns.has(columnName)) {
        const column = table.columns.get(columnName);
        column.isUnique = true;
      } else {
        this.errors.push({
          type: PARSING_ERROR_TYPES.MISSING_COLUMN,
          message: `Unique constraint column '${columnName}' not found in table '${table.name}'`,
          tableName: table.name
        });
      }
    }
    
    // Add constraint to table
    const constraint = {
      type: 'UNIQUE',
      name: `UQ_${table.name}_${columns.join('_')}`,
      columns
    };
    
    table.constraints.push(constraint);
  }

  /**
   * Parse CHECK constraint - New implementation
   * @param {Object} table - Table object
   * @param {string} definition - Check constraint definition
   */
  async parseCheckConstraint(table, definition) {
    // eslint-disable-next-line no-console
    console.log('Parsing check constraint:', definition);
    
    // Pattern to match CHECK (condition)
    const checkPattern = /CHECK\s*\(\s*(.*?)\s*\)/gi;
    
    const match = checkPattern.exec(definition);
    
    if (!match) {
      this.errors.push({
        type: PARSING_ERROR_TYPES.INVALID_CONSTRAINT,
        message: `Invalid CHECK syntax: ${definition}`,
        tableName: table.name
      });
      return;
    }
    
    const condition = match[1];
    
    // Add constraint to table
    const constraint = {
      type: 'CHECK',
      name: `CK_${table.name}_${Date.now()}`, // Generate unique name
      condition
    };
    
    table.constraints.push(constraint);
  }

  /**
   * Extract index definitions
   * @param {string} sql - SQL content
   */
  async extractIndexes(sql) {
    const indexMatches = [...sql.matchAll(INDEX_PATTERNS.CREATE_INDEX)];
    
    for (const match of indexMatches) {
      const isUnique = match[1] ? true : false;
      const indexName = this.cleanIdentifier(match[2]);
      const tableName = this.cleanIdentifier(match[3]);
      const columns = match[4].split(',').map(col => this.cleanIdentifier(col.trim()));

      const index = {
        name: indexName,
        tableName,
        columns,
        isUnique,
        type: 'INDEX'
      };

      this.indexes.set(indexName, index);
      
      // Add to table if it exists
      if (this.tables.has(tableName)) {
        this.tables.get(tableName).indexes.push(index);
      }
      
      this.parseStats.totalIndexes++;
    }
  }

  /**
   * Extract relationships from foreign key constraints
   */
  async extractRelationships() {
    for (const [tableName, table] of this.tables) {
      // Check columns for foreign key references
      for (const [columnName, column] of table.columns) {
        if (column.isForeignKey && column.references) {
          const relationship = {
            fromTable: tableName,
            fromColumn: columnName,
            toTable: column.references.table,
            toColumn: column.references.column,
            type: 'FOREIGN_KEY',
            cardinality: 'MANY_TO_ONE' // Default assumption
          };
          
          this.relationships.push(relationship);
          table.relationships.push(relationship);
          this.parseStats.totalRelationships++;
        }
      }
    }
  }

  /**
   * Validate the parsed schema
   */
  validateSchema() {
    // Check for missing referenced tables
    for (const relationship of this.relationships) {
      if (!this.tables.has(relationship.toTable)) {
        this.errors.push({
          type: PARSING_ERROR_TYPES.MISSING_REFERENCE,
          message: `Referenced table '${relationship.toTable}' not found`,
          tableName: relationship.fromTable
        });
      }
    }

    // Validate table names
    for (const [tableName] of this.tables) {
      if (!VALIDATION_RULES.TABLE_NAME.test(tableName)) {
        this.errors.push({
          type: PARSING_ERROR_TYPES.INVALID_TABLE_NAME,
          message: `Invalid table name: ${tableName}`,
          tableName
        });
      }
    }
  }

  /**
   * Calculate parsing statistics
   */
  calculateStats() {
    this.parseStats.totalTables = this.tables.size;
    this.parseStats.totalRelationships = this.relationships.length;
    this.parseStats.totalIndexes = this.indexes.size;
  }

  /**
   * Clean SQL identifier by removing brackets and quotes
   * @param {string} identifier - SQL identifier
   * @returns {string} Cleaned identifier
   */
  cleanIdentifier(identifier) {
    // Add null/undefined check
    if (!identifier || typeof identifier !== 'string') {
      // eslint-disable-next-line no-console
      console.warn('cleanIdentifier received invalid input:', identifier);
      return '';
    }

    try {
      return identifier
        .replace(/^\[/, '')
        .replace(/\]$/, '')
        .replace(/^'/, '')
        .replace(/'$/, '')
        .replace(/^"/, '')
        .replace(/"$/, '')
        .trim();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error cleaning identifier:', identifier, error);
      return identifier || '';
    }
  }

  /**
   * Parse data type with size information
   * @param {string} dataTypeStr - Data type string
   * @returns {Object} Parsed data type object
   */
  parseDataType(dataTypeStr) {
    if (!dataTypeStr || typeof dataTypeStr !== 'string') {
      return {
        baseType: 'UNKNOWN',
        size: null,
        scale: null,
        fullType: dataTypeStr || 'UNKNOWN',
        mapping: null
      };
    }

    const sizeMatch = dataTypeStr.match(/(\w+)\s*\(\s*(\d+)(?:\s*,\s*(\d+))?\s*\)/);
    
    if (sizeMatch) {
      const baseType = sizeMatch[1].toUpperCase();
      const size = parseInt(sizeMatch[2], 10);
      const scale = sizeMatch[3] ? parseInt(sizeMatch[3], 10) : null;
      
      return {
        baseType,
        size,
        scale,
        fullType: dataTypeStr,
        mapping: DATA_TYPE_MAPPINGS[baseType] || null
      };
    } else {
      const baseType = dataTypeStr.toUpperCase();
      return {
        baseType,
        size: null,
        scale: null,
        fullType: dataTypeStr,
        mapping: DATA_TYPE_MAPPINGS[baseType] || null
      };
    }
  }

  /**
   * Get parsing result
   * @returns {Object} Complete parsing result
   */
  getParseResult() {
    return {
      success: this.errors.length === 0,
      tables: Object.fromEntries(this.tables),
      relationships: this.relationships,
      indexes: Object.fromEntries(this.indexes),
      errors: this.errors,
      warnings: this.warnings,
      stats: this.parseStats
    };
  }
}

// Export singleton instance - MOVED OUTSIDE THE CLASS
export const sqlParser = new SqlParser();