import { useState, useCallback, useRef, useEffect } from 'react';
import { sqlParser } from '../services/sqlParser';
import { astProcessor } from '../services/astProcessor';
import { debounce } from '../utils/helpers';
import { STORAGE_KEYS } from '../utils/constants';
import { getStorageValue, setStorageValue } from '../utils/helpers';

/**
 * React hook for SQL parsing functionality
 * Provides parsing state, methods, and automatic parsing on content changes
 */
export function useSqlParser() {
  // Parsing state
  const [parseResult, setParseResult] = useState(null);
  const [astResult, setAstResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastParsedContent, setLastParsedContent] = useState('');
  
  // Parsing statistics
  const [parseStats, setParseStats] = useState({
    totalTables: 0,
    totalColumns: 0,
    totalRelationships: 0,
    totalIndexes: 0,
    parseTime: 0,
    lastParsed: null
  });

  // Refs for managing async operations
  const parseTimeoutRef = useRef(null);
  const currentParseRef = useRef(null);

  // Load cached results on mount
  useEffect(() => {
    const cached = getStorageValue(STORAGE_KEYS.LAST_PARSE_RESULT, null);
    if (cached && cached.parseResult && cached.astResult) {
      setParseResult(cached.parseResult);
      setAstResult(cached.astResult);
      setParseStats(cached.parseStats || {});
      setLastParsedContent(cached.content || '');
    }
  }, []);

  // Cache results when they change
  useEffect(() => {
    if (parseResult && astResult) {
      const cacheData = {
        parseResult,
        astResult,
        parseStats,
        content: lastParsedContent,
        timestamp: Date.now()
      };
      setStorageValue(STORAGE_KEYS.LAST_PARSE_RESULT, cacheData);
    }
  }, [parseResult, astResult, parseStats, lastParsedContent]);

  /**
   * Parse SQL content manually
   * @param {string} sqlContent - SQL content to parse
   * @returns {Promise<Object>} Parse result
   */
  const parseSQL = useCallback(async (sqlContent) => {
    // Cancel any existing parse operation
    if (currentParseRef.current) {
      currentParseRef.current.cancelled = true;
    }

    // Create new parse operation
    const parseOperation = { cancelled: false };
    currentParseRef.current = parseOperation;

    setIsLoading(true);
    setError(null);

    try {
      // Parse SQL with SqlParser
      const parseResult = await sqlParser.parse(sqlContent);
      
      // Check if operation was cancelled
      if (parseOperation.cancelled) {
        return null;
      }

      setParseResult(parseResult);

      // If parsing was successful, process with AstProcessor
      let astResult = null;
      if (parseResult.success) {
        astResult = await astProcessor.process(parseResult);
        
        if (!parseOperation.cancelled) {
          setAstResult(astResult);
        }
      }

      // Update statistics
      if (!parseOperation.cancelled) {
        setParseStats({
          totalTables: parseResult.stats.totalTables,
          totalColumns: parseResult.stats.totalColumns,
          totalRelationships: parseResult.stats.totalRelationships,
          totalIndexes: parseResult.stats.totalIndexes,
          parseTime: parseResult.stats.parseTime,
          lastParsed: new Date().toISOString()
        });

        setLastParsedContent(sqlContent);
      }

      return { parseResult, astResult };

    } catch (err) {
      if (!parseOperation.cancelled) {
        const errorMessage = err.message || 'Unknown parsing error';
        setError(errorMessage);
        console.error('SQL parsing error:', err);
      }
      return null;
    } finally {
      if (!parseOperation.cancelled) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Debounced parse function for real-time parsing
   */
  const debouncedParse = useCallback(
    debounce((content) => {
      if (content && content.trim() && content !== lastParsedContent) {
        parseSQL(content);
      }
    }, 1000), // Wait 1 second after user stops typing
    [parseSQL, lastParsedContent]
  );

  /**
   * Parse SQL with debouncing for real-time updates
   * @param {string} sqlContent - SQL content to parse
   */
  const parseWithDebounce = useCallback((sqlContent) => {
    // Clear any existing timeout
    if (parseTimeoutRef.current) {
      clearTimeout(parseTimeoutRef.current);
    }

    debouncedParse(sqlContent);
  }, [debouncedParse]);

  /**
   * Force immediate parsing (bypass debounce)
   * @param {string} sqlContent - SQL content to parse
   */
  const parseImmediate = useCallback((sqlContent) => {
    // Clear debounced operation
    if (parseTimeoutRef.current) {
      clearTimeout(parseTimeoutRef.current);
    }
    
    return parseSQL(sqlContent);
  }, [parseSQL]);

  /**
   * Clear parsing results
   */
  const clearResults = useCallback(() => {
    setParseResult(null);
    setAstResult(null);
    setError(null);
    setLastParsedContent('');
    setParseStats({
      totalTables: 0,
      totalColumns: 0,
      totalRelationships: 0,
      totalIndexes: 0,
      parseTime: 0,
      lastParsed: null
    });

    // Clear cached results
    setStorageValue(STORAGE_KEYS.LAST_PARSE_RESULT, null);
  }, []);

  /**
   * Get parsing status for UI
   */
  const getParsingStatus = useCallback(() => {
    if (isLoading) {
      return {
        status: 'PARSING',
        message: 'Parsing SQL content...',
        color: 'warning'
      };
    }

    if (error) {
      return {
        status: 'ERROR',
        message: error,
        color: 'error'
      };
    }

    if (parseResult && !parseResult.success) {
      return {
        status: 'PARSE_ERRORS',
        message: `${parseResult.errors.length} parsing error(s) found`,
        color: 'error',
        errors: parseResult.errors
      };
    }

    if (parseResult && parseResult.success && astResult) {
      return {
        status: 'SUCCESS',
        message: `Found ${parseStats.totalTables} table(s), ${parseStats.totalRelationships} relationship(s)`,
        color: 'success',
        stats: parseStats
      };
    }

    if (!parseResult) {
      return {
        status: 'READY',
        message: 'Ready to parse SQL content',
        color: 'info'
      };
    }

    return {
      status: 'UNKNOWN',
      message: 'Unknown parsing state',
      color: 'info'
    };
  }, [isLoading, error, parseResult, astResult, parseStats]);

  /**
   * Get diagram data for Mermaid rendering
   */
  const getDiagramData = useCallback(() => {
    if (astResult && astResult.success && astResult.diagramData) {
      return astResult.diagramData;
    }
    return null;
  }, [astResult]);

  /**
   * Check if content has changed since last parse
   */
  const hasContentChanged = useCallback((content) => {
    return content !== lastParsedContent;
  }, [lastParsedContent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current);
      }
      if (currentParseRef.current) {
        currentParseRef.current.cancelled = true;
      }
    };
  }, []);

  return {
    // State
    parseResult,
    astResult,
    isLoading,
    error,
    parseStats,
    
    // Methods
    parseSQL,
    parseWithDebounce,
    parseImmediate,
    clearResults,
    
    // Utilities
    getParsingStatus,
    getDiagramData,
    hasContentChanged,
    
    // Status helpers
    isReady: !isLoading && !error,
    hasResults: parseResult !== null,
    hasErrors: parseResult && !parseResult.success,
    hasDiagramData: astResult && astResult.success && astResult.diagramData !== null
  };
}