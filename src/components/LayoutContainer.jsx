import React, { useState, useRef, useCallback, useEffect } from 'react';
import { STORAGE_KEYS } from '../utils/constants';
import { getStorageValue, setStorageValue, debounce } from '../utils/helpers';
import './LayoutContainer.css';

function LayoutContainer({ 
  leftPanel, 
  rightPanel, 
  defaultSplitPercentage = 30, // Changed from 50 to 30
  minLeftWidth = 250, // Reduced minimum for editor
  minRightWidth = 300 
}) {
  // Get initial split from localStorage or use default
  const [splitPercentage, setSplitPercentage] = useState(() => {
    const saved = getStorageValue(STORAGE_KEYS.LAYOUT_SETTINGS, {});
    return saved.splitPercentage || defaultSplitPercentage;
  });

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const splitterRef = useRef(null);

  // Debounced function to save layout settings
  const saveLayoutSettings = useCallback(
    debounce((percentage) => {
      const currentSettings = getStorageValue(STORAGE_KEYS.LAYOUT_SETTINGS, {});
      setStorageValue(STORAGE_KEYS.LAYOUT_SETTINGS, {
        ...currentSettings,
        splitPercentage: percentage
      });
    }, 300),
    []
  );

  // Handle mouse move during drag - IMPROVED
  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current || !isDragging) return;
    
    e.preventDefault(); // Prevent any default behavior
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;
    
    // Calculate new percentage with higher precision
    let newPercentage = (mouseX / containerWidth) * 100;
    
    // Apply constraints with better calculations
    const minLeftPercentage = (minLeftWidth / containerWidth) * 100;
    const minRightPercentage = (minRightWidth / containerWidth) * 100;
    const maxLeftPercentage = 100 - minRightPercentage;
    
    // Clamp the percentage within valid bounds
    newPercentage = Math.max(minLeftPercentage, Math.min(maxLeftPercentage, newPercentage));
    
    // Round to 1 decimal place for smoother movement
    newPercentage = Math.round(newPercentage * 10) / 10;
    
    setSplitPercentage(newPercentage);
  }, [minLeftWidth, minRightWidth, isDragging]);

  // Handle mouse up - end drag
  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Restore normal cursor and text selection
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
    // Save the current split percentage
    saveLayoutSettings(splitPercentage);
  }, [handleMouseMove, saveLayoutSettings, splitPercentage, isDragging]);

  // Handle mouse down on splitter - IMPROVED
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    
    // Add global mouse event listeners with passive: false for better performance
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });
    
    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    
    // Prevent context menu on right-click drag
    document.addEventListener('contextmenu', preventContextMenu);
  }, [handleMouseMove, handleMouseUp]);

  // Prevent context menu during drag
  const preventContextMenu = useCallback((e) => {
    e.preventDefault();
  }, []);

  // Handle keyboard navigation for accessibility
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const step = e.shiftKey ? 5 : 1;
      const direction = e.key === 'ArrowLeft' ? -step : step;
      
      const newPercentage = Math.max(10, Math.min(90, splitPercentage + direction));
      setSplitPercentage(newPercentage);
      saveLayoutSettings(newPercentage);
    }
  }, [splitPercentage, saveLayoutSettings]);

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('contextmenu', preventContextMenu);
      // Restore body styles
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [handleMouseMove, handleMouseUp, preventContextMenu]);

  return (
    <div 
      ref={containerRef}
      className={`layout-container ${isDragging ? 'dragging' : ''}`}
    >
      {/* Left Panel */}
      <div 
        className="layout-panel layout-panel-left"
        style={{ width: `${splitPercentage}%` }}
      >
        {leftPanel}
      </div>

      {/* Splitter - IMPROVED */}
      <div
        ref={splitterRef}
        className="layout-splitter"
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
        aria-valuenow={Math.round(splitPercentage)}
        aria-valuemin={10}
        aria-valuemax={90}
        title="Drag to resize panels"
      >
        <div className="layout-splitter-handle">
          <div className="layout-splitter-dots">
            <div className="splitter-dot"></div>
            <div className="splitter-dot"></div>
            <div className="splitter-dot"></div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div 
        className="layout-panel layout-panel-right"
        style={{ width: `${100 - splitPercentage}%` }}
      >
        {rightPanel}
      </div>
    </div>
  );
}

export default LayoutContainer;