import { PARSING_ERROR_TYPES } from '../utils/sqlPatterns';

/**
 * AST Processor Service
 * Processes parsed SQL AST and prepares data for diagram generation
 */
export class AstProcessor {
  constructor() {
    this.reset();
  }

  /**
   * Reset processor state
   */
  reset() {
    this.processedTables = new Map();
    this.processedRelationships = [];
    this.diagramData = null;
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Process parsed SQL result and prepare for diagram generation
   * @param {Object} parseResult - Result from SqlParser
   * @returns {Object} Processed AST data
   */
  async process(parseResult) {
    try {
      this.reset();
      
      if (!parseResult || !parseResult.success) {
        throw new Error('Invalid or failed parse result provided');
      }

      // Process tables and enhance with metadata
      await this.processTables(parseResult.tables);
      
      // Process relationships and determine cardinality
      await this.processRelationships(parseResult.relationships);
      
      // Generate diagram data structure
      await this.generateDiagramData();
      
      return this.getProcessResult();
      
    } catch (error) {
      this.errors.push({
        type: PARSING_ERROR_TYPES.SYNTAX_ERROR,
        message: `AST Processing error: ${error.message}`,
        source: 'AstProcessor'
      });
      
      return this.getProcessResult();
    }
  }

  /**
   * Process tables and enhance with metadata
   * @param {Object} tables - Parsed tables from SqlParser
   */
  async processTables(tables) {
    for (const [tableName, table] of Object.entries(tables)) {
      const processedTable = {
        name: tableName,
        displayName: this.generateDisplayName(tableName),
        columns: new Map(),
        primaryKeys: [],
        foreignKeys: [],
        uniqueKeys: [],
        indexes: table.indexes || [],
        constraints: table.constraints || [],
        metadata: {
          columnCount: 0,
          hasIdentity: false,
          hasPrimaryKey: false,
          hasTimestamp: false,
          estimatedSize: 'SMALL'
        }
      };

      // Process columns
      for (const [columnName, column] of Object.entries(table.columns)) {
        const processedColumn = this.processColumn(column, tableName);
        processedTable.columns.set(columnName, processedColumn);
        
        // Update table metadata
        this.updateTableMetadata(processedTable, processedColumn);
      }

      // Categorize keys
      this.categorizeTableKeys(processedTable);
      
      this.processedTables.set(tableName, processedTable);
    }
  }

  /**
   * Process individual column
   * @param {Object} column - Column data
   * @param {string} tableName - Parent table name
   * @returns {Object} Processed column
   */
  processColumn(column, tableName) {
    return {
      name: column.name,
      displayName: this.generateDisplayName(column.name),
      dataType: column.dataType,
      isNullable: column.isNullable,
      isPrimaryKey: column.isPrimaryKey,
      isForeignKey: column.isForeignKey,
      isUnique: column.isUnique,
      isIdentity: column.isIdentity,
      defaultValue: column.defaultValue,
      references: column.references,
      metadata: {
        category: this.getColumnCategory(column.dataType),
        displayType: this.formatDataTypeDisplay(column.dataType),
        sortOrder: this.getColumnSortOrder(column),
        icon: this.getColumnIcon(column)
      }
    };
  }

  /**
   * Update table metadata based on column
   * @param {Object} table - Table object
   * @param {Object} column - Column object
   */
  updateTableMetadata(table, column) {
    table.metadata.columnCount++;
    
    if (column.isPrimaryKey) {
      table.metadata.hasPrimaryKey = true;
    }
    
    if (column.isIdentity) {
      table.metadata.hasIdentity = true;
    }
    
    if (column.dataType.baseType === 'TIMESTAMP') {
      table.metadata.hasTimestamp = true;
    }
  }

  /**
   * Categorize table keys (primary, foreign, unique)
   * @param {Object} table - Table object
   */
  categorizeTableKeys(table) {
    for (const [columnName, column] of table.columns) {
      if (column.isPrimaryKey) {
        table.primaryKeys.push({
          columnName,
          column,
          type: 'PRIMARY'
        });
      }
      
      if (column.isForeignKey) {
        table.foreignKeys.push({
          columnName,
          column,
          references: column.references,
          type: 'FOREIGN'
        });
      }
      
      if (column.isUnique && !column.isPrimaryKey) {
        table.uniqueKeys.push({
          columnName,
          column,
          type: 'UNIQUE'
        });
      }
    }
  }

  /**
   * Process relationships and determine cardinality
   * @param {Array} relationships - Parsed relationships
   */
  async processRelationships(relationships) {
    for (const relationship of relationships) {
      const processedRelationship = {
        id: `${relationship.fromTable}_${relationship.fromColumn}_${relationship.toTable}_${relationship.toColumn}`,
        fromTable: relationship.fromTable,
        fromColumn: relationship.fromColumn,
        toTable: relationship.toTable,
        toColumn: relationship.toColumn,
        type: relationship.type,
        cardinality: this.determineCardinality(relationship),
        metadata: {
          displayLabel: this.generateRelationshipLabel(relationship),
          strength: this.getRelationshipStrength(relationship),
          cascade: this.analyzeCascadeOptions(relationship)
        }
      };

      this.processedRelationships.push(processedRelationship);
    }
  }

  /**
   * Determine relationship cardinality
   * @param {Object} relationship - Relationship object
   * @returns {string} Cardinality type
   */
  determineCardinality(relationship) {
    const fromTable = this.processedTables.get(relationship.fromTable);
    const toTable = this.processedTables.get(relationship.toTable);
    
    if (!fromTable || !toTable) {
      return 'UNKNOWN';
    }

    const fromColumn = fromTable.columns.get(relationship.fromColumn);
    const toColumn = toTable.columns.get(relationship.toColumn);
    
    if (!fromColumn || !toColumn) {
      return 'UNKNOWN';
    }

    // If referencing column is primary key, it's likely one-to-many
    if (toColumn.isPrimaryKey) {
      if (fromColumn.isUnique || fromColumn.isPrimaryKey) {
        return 'ONE_TO_ONE';
      } else {
        return 'MANY_TO_ONE';
      }
    }
    
    // If both are unique, it's one-to-one
    if (fromColumn.isUnique && toColumn.isUnique) {
      return 'ONE_TO_ONE';
    }
    
    // Default to many-to-many for complex cases
    return 'MANY_TO_MANY';
  }

  /**
   * Generate diagram data structure for Mermaid
   * @returns {Object} Diagram data
   */
  async generateDiagramData() {
    const entities = [];
    const relationships = [];

    // Process entities (tables)
    for (const [tableName, table] of this.processedTables) {
      const entity = {
        name: tableName,
        displayName: table.displayName,
        type: 'TABLE',
        columns: [],
        metadata: table.metadata
      };

      // Add columns to entity
      const sortedColumns = Array.from(table.columns.values())
        .sort((a, b) => a.metadata.sortOrder - b.metadata.sortOrder);

      for (const column of sortedColumns) {
        entity.columns.push({
          name: column.name,
          type: column.metadata.displayType,
          key: this.getColumnKeyType(column),
          nullable: column.isNullable,
          icon: column.metadata.icon
        });
      }

      entities.push(entity);
    }

    // Process relationships
    for (const relationship of this.processedRelationships) {
      relationships.push({
        from: relationship.fromTable,
        to: relationship.toTable,
        type: relationship.cardinality,
        label: relationship.metadata.displayLabel
      });
    }

    this.diagramData = {
      entities,
      relationships,
      metadata: {
        totalEntities: entities.length,
        totalRelationships: relationships.length,
        diagramType: 'ERD',
        theme: 'default',
        layout: 'auto'
      }
    };
  }

  /**
   * Generate display name from technical name
   * @param {string} name - Technical name
   * @returns {string} Display name
   */
  generateDisplayName(name) {
    // Convert snake_case or camelCase to Title Case
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }

  /**
   * Get column category for grouping
   * @param {Object} dataType - Data type object
   * @returns {string} Category
   */
  getColumnCategory(dataType) {
    if (!dataType.mapping) {
      return 'UNKNOWN';
    }
    
    const category = dataType.mapping.category;
    
    switch (category) {
      case 'integer':
      case 'decimal':
      case 'float':
      case 'money':
        return 'NUMERIC';
      case 'varchar':
      case 'char':
      case 'text':
        return 'TEXT';
      case 'datetime':
      case 'date':
      case 'time':
        return 'TEMPORAL';
      case 'boolean':
        return 'BOOLEAN';
      case 'binary':
        return 'BINARY';
      case 'guid':
        return 'IDENTIFIER';
      default:
        return 'OTHER';
    }
  }

  /**
   * Format data type for display
   * @param {Object} dataType - Data type object
   * @returns {string} Formatted type
   */
  formatDataTypeDisplay(dataType) {
    if (dataType.size && dataType.scale) {
      return `${dataType.baseType}(${dataType.size},${dataType.scale})`;
    } else if (dataType.size) {
      return `${dataType.baseType}(${dataType.size})`;
    } else {
      return dataType.baseType;
    }
  }

  /**
   * Get column sort order for display
   * @param {Object} column - Column object
   * @returns {number} Sort order
   */
  getColumnSortOrder(column) {
    if (column.isPrimaryKey) return 1;
    if (column.isForeignKey) return 2;
    if (column.isUnique) return 3;
    if (column.isIdentity) return 4;
    if (!column.isNullable) return 5;
    return 6;
  }

  /**
   * Get column icon based on properties
   * @param {Object} column - Column object
   * @returns {string} Icon
   */
  getColumnIcon(column) {
    if (column.isPrimaryKey) return '🔑';
    if (column.isForeignKey) return '🔗';
    if (column.isUnique) return '⭐';
    if (column.isIdentity) return '🔢';
    return '';
  }

  /**
   * Get column key type for display
   * @param {Object} column - Column object
   * @returns {string} Key type
   */
  getColumnKeyType(column) {
    if (column.isPrimaryKey) return 'PK';
    if (column.isForeignKey) return 'FK';
    if (column.isUnique) return 'UQ';
    return '';
  }

  /**
   * Generate relationship label
   * @param {Object} relationship - Relationship object
   * @returns {string} Label
   */
  generateRelationshipLabel(relationship) {
    return `${relationship.fromColumn} → ${relationship.toColumn}`;
  }

  /**
   * Get relationship strength
   * @param {Object} relationship - Relationship object
   * @returns {string} Strength
   */
  getRelationshipStrength(relationship) {
    // This could be enhanced based on cascade rules, constraints, etc.
    return relationship.type === 'FOREIGN_KEY' ? 'STRONG' : 'WEAK';
  }

  /**
   * Analyze cascade options (placeholder for future enhancement)
   * @param {Object} relationship - Relationship object
   * @returns {Object} Cascade options
   */
  analyzeCascadeOptions(relationship) {
    return {
      onDelete: 'NO_ACTION',
      onUpdate: 'NO_ACTION'
    };
  }

  /**
   * Get processing result
   * @returns {Object} Complete processing result
   */
  getProcessResult() {
    return {
      success: this.errors.length === 0,
      tables: Object.fromEntries(this.processedTables),
      relationships: this.processedRelationships,
      diagramData: this.diagramData,
      errors: this.errors,
      warnings: this.warnings,
      metadata: {
        processingComplete: true,
        totalTables: this.processedTables.size,
        totalRelationships: this.processedRelationships.length,
        diagramReady: this.diagramData !== null
      }
    };
  }
}

// Export singleton instance
export const astProcessor = new AstProcessor();