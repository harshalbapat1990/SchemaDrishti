import React, { useState, useRef, useCallback, useEffect } from 'react';
import { STORAGE_KEYS } from '../utils/constants';
import { getStorageValue, setStorageValue, debounce } from '../utils/helpers';
import './LayoutContainer.css';

function LayoutContainer({ 
  leftPanel, 
  rightPanel, 
  defaultSplitPercentage = 30,
  minLeftWidth = 250,
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
  const dragStateRef = useRef({ isDragging: false, startX: 0, startPercentage: 0 });

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

  // Handle mouse move during drag - FIXED for smooth movement
  const handleMouseMove = useCallback((e) => {
    if (!dragStateRef.current.isDragging || !containerRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    
    // Calculate the mouse movement from the start position
    const currentX = e.clientX - containerRect.left;
    const deltaX = currentX - dragStateRef.current.startX;
    const deltaPercentage = (deltaX / containerWidth) * 100;
    
    // Calculate new percentage based on starting percentage + delta
    let newPercentage = dragStateRef.current.startPercentage + deltaPercentage;
    
    // Apply constraints
    const minLeftPercentage = (minLeftWidth / containerWidth) * 100;
    const minRightPercentage = (minRightWidth / containerWidth) * 100;
    const maxLeftPercentage = 100 - minRightPercentage;
    
    // Clamp the percentage within valid bounds
    newPercentage = Math.max(minLeftPercentage, Math.min(maxLeftPercentage, newPercentage));
    
    // Update the state immediately for smooth movement
    setSplitPercentage(newPercentage);
    
  }, [minLeftWidth, minRightWidth]);

  // Handle mouse up - end drag
  const handleMouseUp = useCallback(() => {
    if (!dragStateRef.current.isDragging) return;
    
    dragStateRef.current.isDragging = false;
    setIsDragging(false);
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('mouseup', handleMouseUp, true);
    document.removeEventListener('selectstart', preventSelection, true);
    document.removeEventListener('dragstart', preventSelection, true);
    
    // Restore normal cursor and text selection
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    document.body.classList.remove('layout-dragging');
    
    // Save the current split percentage
    saveLayoutSettings(splitPercentage);
    
    console.log('Drag ended, final percentage:', splitPercentage);
    
  }, [handleMouseMove, saveLayoutSettings, splitPercentage]);

  // Prevent text selection during drag
  const preventSelection = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, []);

  // Handle mouse down on splitter - FIXED initialization
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only handle left mouse button
    if (e.button !== 0) return;
    
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Initialize drag state
    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX - containerRect.left,
      startPercentage: splitPercentage
    };
    
    setIsDragging(true);
    
    // Add global event listeners with capture=true for better handling
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('mouseup', handleMouseUp, true);
    document.addEventListener('selectstart', preventSelection, true);
    document.addEventListener('dragstart', preventSelection, true);
    
    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    document.body.classList.add('layout-dragging');
    
    console.log('Drag started at:', dragStateRef.current.startX, 'percentage:', splitPercentage);
    
  }, [splitPercentage, handleMouseMove, handleMouseUp, preventSelection]);

  // Handle keyboard navigation for accessibility
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const step = e.shiftKey ? 5 : 1;
      const direction = e.key === 'ArrowLeft' ? -step : step;
      
      let newPercentage = splitPercentage + direction;
      
      // Apply same constraints as mouse
      if (containerRef.current) {
        const containerWidth = containerRef.current.getBoundingClientRect().width;
        const minLeftPercentage = (minLeftWidth / containerWidth) * 100;
        const minRightPercentage = (minRightWidth / containerWidth) * 100;
        const maxLeftPercentage = 100 - minRightPercentage;
        
        newPercentage = Math.max(minLeftPercentage, Math.min(maxLeftPercentage, newPercentage));
      }
      
      setSplitPercentage(newPercentage);
      saveLayoutSettings(newPercentage);
    }
  }, [splitPercentage, saveLayoutSettings, minLeftWidth, minRightWidth]);

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('mouseup', handleMouseUp, true);
      document.removeEventListener('selectstart', preventSelection, true);
      document.removeEventListener('dragstart', preventSelection, true);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.body.classList.remove('layout-dragging');
      dragStateRef.current.isDragging = false;
    };
  }, [handleMouseMove, handleMouseUp, preventSelection]);

  // Handle window resize to maintain proportions
  useEffect(() => {
    const handleResize = debounce(() => {
      // Force a re-render with current percentage to maintain proportions
      setSplitPercentage(prev => prev);
    }, 100);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`layout-container ${isDragging ? 'dragging' : ''}`}
    >
      {/* Left Panel */}
      <div 
        className="layout-panel layout-panel-left"
        style={{ width: `calc(${splitPercentage}% - 4px)` }}
      >
        {leftPanel}
      </div>

      {/* Splitter */}
      <div
        ref={splitterRef}
        className="layout-splitter"
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize panels. Current split: ${Math.round(splitPercentage)}% / ${Math.round(100 - splitPercentage)}%`}
        aria-valuenow={Math.round(splitPercentage)}
        aria-valuemin={10}
        aria-valuemax={90}
        title={`Drag to resize panels (${Math.round(splitPercentage)}% / ${Math.round(100 - splitPercentage)}%)`}
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
        style={{ width: `calc(${100 - splitPercentage}% - 4px)` }}
      >
        {rightPanel}
      </div>
    </div>
  );
}

export default LayoutContainer;