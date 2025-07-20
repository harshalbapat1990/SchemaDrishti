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
  THEME: 'schemadrishti_theme',
  SQL_CONTENT: 'schemadrishti_sql_content',
  LAYOUT_SETTINGS: 'schemadrishti_layout',
  EDITOR_SETTINGS: 'schemadrishti_editor_settings'
};

// Editor constants
export const EDITOR_DEFAULTS = {
  LANGUAGE: 'sql',
  THEME_LIGHT: 'vs',
  THEME_DARK: 'vs-dark',
  FONT_SIZE: 14,
  TAB_SIZE: 2,
  WORD_WRAP: 'on',
  LINE_NUMBERS: 'on',
  MINIMAP_ENABLED: true
};

// Parsing constants
export const PARSER_SETTINGS = {
  DEBOUNCE_DELAY: 500, // ms
  MAX_PARSE_TIME: 5000 // ms
};

// Diagram constants
export const DIAGRAM_SETTINGS = {
  RENDER_DEBOUNCE: 300, // ms
  MAX_ENTITIES: 50,
  THEME_LIGHT: 'default',
  THEME_DARK: 'dark'
};

// SQL Editor specific constants
export const SQL_EDITOR = {
  DEFAULT_CONTENT_KEY: 'default_sql_content',
  AUTO_SAVE_DELAY: 500,
  FORMAT_ON_TYPE: true,
  SUGGEST_ON_TRIGGER: true,
  PARAMETER_HINTS: true,
  QUICK_SUGGESTIONS: true
};