// Application constants
export const APP_NAME = 'SchemaDrishti';
export const VERSION = '1.0.0-MVP1';

// Theme constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
};

// Local storage keys
export const STORAGE_KEYS = {
  SQL_CONTENT: 'schema_drishti_sql_content',
  LAYOUT_SETTINGS: 'schema_drishti_layout_settings',
  THEME_PREFERENCE: 'schema_drishti_theme',
  LAST_PARSE_RESULT: 'schema_drishti_last_parse_result',
  PARSE_SETTINGS: 'schema_drishti_parse_settings',
  PARSE_HISTORY: 'schema_drishti_parse_history'
};

// Editor constants
export const EDITOR_DEFAULTS = {
  FONT_SIZE: 14,
  TAB_SIZE: 2,
  THEME_LIGHT: 'vs-light',
  THEME_DARK: 'vs-dark'
};

// Layout defaults
export const LAYOUT_DEFAULTS = {
  SPLIT_PERCENTAGE: 50,
  MIN_LEFT_WIDTH: 300,
  MIN_RIGHT_WIDTH: 300
};

// Parsing constants
export const PARSING_CONSTANTS = {
  // Auto-parse settings
  DEBOUNCE_DELAY: 1000, // ms to wait after user stops typing
  MAX_PARSE_TIME: 30000, // max time to allow for parsing (30s)
  
  // Content limits
  MAX_SQL_LENGTH: 1000000, // 1MB max SQL content
  MAX_TABLES: 100,
  MAX_COLUMNS_PER_TABLE: 200,
  MAX_RELATIONSHIPS: 500,
  
  // Parsing modes
  PARSE_MODE: {
    AUTOMATIC: 'AUTOMATIC',
    MANUAL: 'MANUAL',
    ON_SAVE: 'ON_SAVE'
  },
  
  // Error thresholds
  MAX_ERRORS_DISPLAY: 10,
  MAX_WARNINGS_DISPLAY: 5,
  
  // Cache settings
  CACHE_DURATION: 3600000, // 1 hour in ms
  MAX_CACHE_SIZE: 10 // max cached parse results
};

// Diagram generation constants
export const DIAGRAM_CONSTANTS = {
  // Mermaid settings
  MERMAID_CONFIG: {
    theme: 'default',
    themeVariables: {
      primaryColor: '#2563eb',
      primaryTextColor: '#1e293b',
      primaryBorderColor: '#3b82f6',
      lineColor: '#6b7280',
      secondaryColor: '#f1f5f9',
      tertiaryColor: '#f8fafc'
    }
  },
  
  // Entity relationship diagram settings
  ERD_SETTINGS: {
    maxEntitiesPerRow: 4,
    showDataTypes: true,
    showConstraints: true,
    showIndexes: false,
    compactMode: false
  },
  
  // Export formats
  EXPORT_FORMATS: ['PNG', 'SVG', 'PDF', 'MERMAID']
};

// Performance monitoring
export const PERFORMANCE_CONSTANTS = {
  // Warning thresholds
  SLOW_PARSE_THRESHOLD: 5000, // 5 seconds
  LARGE_SCHEMA_THRESHOLD: 50, // 50+ tables
  
  // Memory limits
  MAX_MEMORY_USAGE: 100 * 1024 * 1024, // 100MB
  
  // Metrics to track
  METRICS: {
    PARSE_TIME: 'parse_time',
    SCHEMA_SIZE: 'schema_size',
    ERROR_COUNT: 'error_count',
    MEMORY_USAGE: 'memory_usage'
  }
};