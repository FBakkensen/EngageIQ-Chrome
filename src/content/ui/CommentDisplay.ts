import { ICommentDisplay } from '../services/interfaces/ICommentDisplay';
import { ThemeDetector } from '../services/ThemeDetector';
import { Logger } from '../services/Logger';
// import { DOMUtils } from '../utils/DOMUtils';

/**
 * Type definition for comment length options
 */
export type CommentLength = 'very_short' | 'short' | 'medium' | 'long' | 'very_long';

/**
 * CommentDisplay - UI component for displaying generated comments
 */
export class CommentDisplay implements ICommentDisplay {
  private logger: Logger;
  private themeDetector: ThemeDetector;
  private selectedLength: CommentLength = 'medium'; // Temporary preference for current popup only
  private savedUserPreference: CommentLength = 'medium'; // Persistent user preference stored in Chrome storage
  private _isRegenerating: boolean = false;
  private _debugMode: boolean = false; // Disable debug logs
  private _pendingLengthSelection: CommentLength | null = null; // Store pending selection
  
  constructor() {
    this.logger = new Logger('CommentDisplay');
    this.themeDetector = new ThemeDetector();
    
    // Load user preference
    this.loadLengthPreference();
    
    // Setup message listener to preserve length during regeneration
    this.setupMessageListener();
  }
  
  /**
   * Debug log helper function
   */
  private debugLog(message: string, ...data: any[]): void {
    if (this._debugMode) {
      console.log(`🔍 DEBUG: ${message}`, ...data);
    }
  }
  
  /**
   * Load comment length preference from storage
   */
  private async loadLengthPreference(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ 
        type: 'GET_COMMENT_LENGTH_PREFERENCE' 
      });
      
      if (response && response.preference) {
        this.selectedLength = response.preference;
        this.savedUserPreference = response.preference; // Store the permanent preference
        this.logger.info('Loaded length preference:', this.selectedLength);
      }
    } catch (error) {
      this.logger.error('Error loading length preference:', error);
      // Fall back to default preference if context is invalidated
      this.selectedLength = 'medium';
      this.savedUserPreference = 'medium';
    }
  }
  
  /**
   * Save comment length preference to storage
   * Note: This method is kept for potential future use of permanent preference saving
   * Currently not actively used since we're implementing temporary preferences
   */
  private async saveLengthPreference(length: CommentLength): Promise<void> {
    try {
      await chrome.runtime.sendMessage({ 
        type: 'SET_COMMENT_LENGTH_PREFERENCE',
        payload: length
      });
      this.savedUserPreference = length; // Update the saved preference
      this.logger.info('Saved length preference:', length);
    } catch (error) {
      this.logger.error('Error saving length preference:', error);
    }
  }
  
  /**
   * Set up message listener to handle comment generation responses
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'COMMENT_GENERATED') {
        this.debugLog('Received COMMENT_GENERATED message', {
          message,
          pendingSelection: this._pendingLengthSelection,
          currentSelection: this.selectedLength
        });
        
        // If we have a pending selection, apply it immediately
        if (this._pendingLengthSelection) {
          this.debugLog('Setting selectedLength to pending selection:', this._pendingLengthSelection);
          this.selectedLength = this._pendingLengthSelection;
          this._pendingLengthSelection = null;
          
          // Store the selection in localStorage for redundancy
          try {
            // Force both storage mechanisms to ensure it's preserved
            localStorage.setItem('engageiq_temp_length', this.selectedLength);
            localStorage.setItem('engageiq_last_selected_length', this.selectedLength);
            this.debugLog('Stored selection in localStorage:', this.selectedLength);
          } catch (e) {
            this.debugLog('Could not store in localStorage:', e);
          }
          
          // Also add a "force update" tag to ensure it's applied
          try {
            const forceUpdateTag = document.createElement('div');
            forceUpdateTag.id = 'engageiq-force-selection-update';
            forceUpdateTag.style.display = 'none';
            forceUpdateTag.dataset.length = this.selectedLength;
            // Add a flag to center the next popup
            forceUpdateTag.dataset.centerPopup = 'true';
            
            // Remove any existing tag
            const existingTag = document.getElementById('engageiq-force-selection-update');
            if (existingTag) {
              existingTag.remove();
            }
            
            // Add the new tag
            document.body.appendChild(forceUpdateTag);
            this.debugLog('Added force update tag for selection:', this.selectedLength);
          } catch (e) {
            this.debugLog('Could not add force update tag:', e);
          }
        }
      }
      return false; // Allow other listeners to process the message too
    });
  }
  
  /**
   * Show the comments UI for a field
   * @param comments Generated comments
   * @param fieldId ID of the comment field
   */
  async showCommentsUI(comments: any, fieldId: string): Promise<void> {
    this.logger.info('Showing comments UI for', { comments, fieldId });
    
    // Check if we're regenerating comments or opening a fresh popup
    const isNewPopup = !this._isRegenerating && !this._pendingLengthSelection;
    this.debugLog('Opening popup, isNewPopup:', isNewPopup);
    
    // For new popups (not regenerating), always use the saved user preference
    if (isNewPopup) {
      // Load the saved user preference first
      await this.loadLengthPreference();
      this.debugLog('New popup opened - Using saved user preference:', this.savedUserPreference);
      this.selectedLength = this.savedUserPreference;
      
      // Clear any temporary data
      localStorage.removeItem('engageiq_temp_length');
      localStorage.removeItem('engageiq_last_selected_length');
      
      // Also clear global variable if it exists
      try {
        if ((window as any).__engageiq_last_length_selection) {
          delete (window as any).__engageiq_last_length_selection;
        }
      } catch (e) {
        this.debugLog('Error clearing global variable:', e);
      }
      
      // Clear any existing force update tag
      try {
        const existingTag = document.getElementById('engageiq-force-selection-update');
        if (existingTag) {
          existingTag.remove();
        }
      } catch (e) {
        this.debugLog('Error removing force update tag:', e);
      }
    } 
    // For regeneration, use the temporary selection logic
    else {
      let foundSavedSelection = false;
      
      // First check for global variable (last resort)
      try {
        const globalLength = (window as any).__engageiq_last_length_selection;
        if (globalLength && this.isValidLength(globalLength)) {
          this.debugLog('Found global length variable:', globalLength);
          this.selectedLength = globalLength as CommentLength;
          foundSavedSelection = true;
        }
      } catch (e) {
        this.debugLog('Error accessing global variable:', e);
      }
      
      // Next check for force update tag
      if (!foundSavedSelection) {
        try {
          const forceUpdateTag = document.getElementById('engageiq-force-selection-update');
          if (forceUpdateTag && forceUpdateTag.dataset.length) {
            const forcedLength = forceUpdateTag.dataset.length as CommentLength;
            if (this.isValidLength(forcedLength)) {
              this.debugLog('Found force update tag with length:', forcedLength);
              this.selectedLength = forcedLength;
              forceUpdateTag.remove();
              foundSavedSelection = true;
            }
          }
        } catch (e) {
          this.debugLog('Error checking force update tag:', e);
        }
      }
      
      // Next, check localStorage for a temporary selection
      if (!foundSavedSelection) {
        try {
          // Try the latest temp selection first
          const storedLength = localStorage.getItem('engageiq_temp_length');
          if (storedLength && this.isValidLength(storedLength)) {
            this.debugLog('Found stored temp length in localStorage:', storedLength);
            this.selectedLength = storedLength as CommentLength;
            localStorage.removeItem('engageiq_temp_length');
            foundSavedSelection = true;
          } 
          // If not found, try the last selected length
          else {
            const lastSelectedLength = localStorage.getItem('engageiq_last_selected_length');
            if (lastSelectedLength && this.isValidLength(lastSelectedLength)) {
              this.debugLog('Found last selected length in localStorage:', lastSelectedLength);
              this.selectedLength = lastSelectedLength as CommentLength;
              foundSavedSelection = true;
            }
          }
        } catch (e) {
          this.debugLog('Error accessing localStorage:', e);
        }
      }
      
      // Check if we have a pending length selection
      if (!foundSavedSelection && this._pendingLengthSelection) {
        this.debugLog('Using pending length selection:', this._pendingLengthSelection);
        this.selectedLength = this._pendingLengthSelection;
        this._pendingLengthSelection = null;
        foundSavedSelection = true;
      }
      
      // If all else fails, load from user preference
      if (!foundSavedSelection) {
        this.debugLog('No saved selection found, using saved preference');
        await this.loadLengthPreference();
        this.selectedLength = this.savedUserPreference;
      }
    }
    
    // Reset regeneration flag
    this._isRegenerating = false;
    
    // Log current state
    this.debugLog('showCommentsUI - Final selection state:', {
      selectedLength: this.selectedLength,
      savedUserPreference: this.savedUserPreference,
      isNewPopup
    });
    
    // Find the field
    const field = document.getElementById(fieldId);
    if (!field) {
      console.warn('⚠️ CommentDisplay: Field not found:', fieldId);
      return;
    }
    
    // Hide the Generate Comment button for this field
    const generateButton = document.querySelector(`button[data-field-id="${fieldId}"]`) as HTMLElement;
    if (generateButton) {
      generateButton.style.display = 'none';
      this.logger.info('Hidden Generate Comment button while popup is open');
    }
    
    // Determine if we're in dark mode
    const isDarkMode = this.themeDetector.isDarkMode();
    
    // Create the comments UI container - enhanced floating design with more width
    const commentsUI = document.createElement('div');
    commentsUI.className = 'engageiq-comments-ui';
    commentsUI.style.cssText = `
      position: fixed;
      width: 550px;
      max-width: 95vw;
      background-color: ${isDarkMode ? '#1d2226' : 'white'};
      color: ${isDarkMode ? '#f5f5f5' : '#1d2226'};
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, ${isDarkMode ? '0.4' : '0.2'});
      z-index: 9999;
      padding: 20px;
      max-height: 80vh;
      overflow-y: auto;
      font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      transition: all 0.2s ease-in-out;
      border: 1px solid ${isDarkMode ? '#3d3d3d' : '#e3e3e3'};
    `;
    
    // Position the comments UI
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = 550; // Match width from CSS above
    const popupHeight = 450; // Approximate height for calculations
    
    // ALWAYS center the popup in the viewport - this is the most reliable approach
    const initialLeft = Math.max(0, (viewportWidth - popupWidth) / 2);
    const initialTop = Math.max(0, (viewportHeight - popupHeight) / 2);
    this.logger.info('Positioning popup in center of screen', { initialLeft, initialTop });
    
    // Set initial position
    commentsUI.style.top = `${initialTop}px`;
    commentsUI.style.left = `${initialLeft}px`;
    
    // Create header with enhanced drag handle styling
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      cursor: move;
      padding-bottom: 12px;
      border-bottom: 1px solid ${isDarkMode ? '#3d3d3d' : '#e3e3e3'};
    `;
    
    // Add improved drag indicator to visually show it's draggable
    const dragIndicator = document.createElement('div');
    dragIndicator.style.cssText = `
      display: flex;
      align-items: center;
      gap: 3px;
      padding: 6px 8px;
      background-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)'};
      border-radius: 4px;
      margin-right: 8px;
      cursor: move;
      position: relative;
      border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
      transition: background-color 0.2s;
    `;
    
    // Add tooltip for drag handle with improved styling
    const dragTooltip = document.createElement('span');
    dragTooltip.textContent = 'Drag here to move • Double-click to center';
    dragTooltip.style.cssText = `
      position: absolute;
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s, visibility 0.2s;
      pointer-events: none;
      top: -36px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    // Add a small arrow at the bottom of the tooltip
    const tooltipArrow = document.createElement('div');
    tooltipArrow.style.cssText = `
      position: absolute;
      bottom: -4px;
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
      width: 8px;
      height: 8px;
      background-color: rgba(0, 0, 0, 0.8);
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    `;
    dragTooltip.appendChild(tooltipArrow);
    
    // Show tooltip initially and hide after 3 seconds
    setTimeout(() => {
      dragTooltip.style.opacity = '1';
      dragTooltip.style.visibility = 'visible';
      
      // Add a subtle pulse animation to draw attention
      const pulseStyle = document.createElement('style');
      pulseStyle.textContent = `
        @keyframes pulse {
          0% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.05); }
          100% { transform: translateX(-50%) scale(1); }
        }
      `;
      document.head.appendChild(pulseStyle);
      dragTooltip.style.animation = 'pulse 1s ease-in-out 3';
      
      // Hide tooltip after 3 seconds
      setTimeout(() => {
        dragTooltip.style.opacity = '0';
        dragTooltip.style.visibility = 'hidden';
        dragTooltip.style.animation = '';
      }, 3000);
    }, 800); // Show after initial popup animation finishes
    
    // Standard hover behavior for tooltip after initial display
    dragIndicator.addEventListener('mouseenter', () => {
      // Only show if it's not already visible
      if (dragTooltip.style.visibility !== 'visible') {
        dragTooltip.style.opacity = '1';
        dragTooltip.style.visibility = 'visible';
        dragTooltip.style.animation = ''; // Remove any animation
      }
      
      // Change background color on hover
      dragIndicator.style.backgroundColor = isDarkMode ? 
        'rgba(255, 255, 255, 0.12)' : 
        'rgba(0, 0, 0, 0.1)';
    });
    
    dragIndicator.addEventListener('mouseleave', () => {
      dragTooltip.style.opacity = '0';
      dragTooltip.style.visibility = 'hidden';
      
      // Reset background color
      dragIndicator.style.backgroundColor = isDarkMode ? 
        'rgba(255, 255, 255, 0.08)' : 
        'rgba(0, 0, 0, 0.07)';
    });
    
    dragIndicator.appendChild(dragTooltip);
    
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.style.cssText = `
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background-color: ${isDarkMode ? '#b0b0b0' : '#555'};
      `;
      dragIndicator.appendChild(dot);
    }
    
    const title = document.createElement('h3');
    // Use textContent to ensure proper text rendering
    title.textContent = '';
    const titleText = document.createTextNode('AI Comment Suggestions');
    title.appendChild(titleText);
    
    title.style.cssText = `
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    // Add the drag indicator to the title
    title.prepend(dragIndicator);
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 22px;
      cursor: pointer;
      color: ${isDarkMode ? '#f5f5f5' : '#1d2226'};
      padding: 4px 8px;
      transition: opacity 0.2s;
      opacity: 0.8;
    `;
    
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.opacity = '1';
    });
    
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.opacity = '0.8';
    });
    
    // Add click handler to restore the button when closing
    closeButton.addEventListener('click', () => {
      // Show the Generate Comment button again
      if (generateButton) {
        this.restoreGenerateButton(generateButton);
        this.logger.info('Restored Generate Comment button visibility');
      }
      
      // Remove the popup
      commentsUI.remove();
    });
    
    header.appendChild(title);
    header.appendChild(closeButton);
    commentsUI.appendChild(header);
    
    // Implement drag functionality
    this.implementDragFunctionality(header, commentsUI);
    
    // Add length preference selector
    const lengthPreferenceSection = this.createLengthPreferenceSelector(isDarkMode, fieldId, commentsUI);
    commentsUI.appendChild(lengthPreferenceSection);
    
    // Create tabbed content container
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'engageiq-tabs-container';
    
    // Create tabs navigation
    const tabsNav = document.createElement('div');
    tabsNav.className = 'engageiq-tabs-nav';
    tabsNav.style.cssText = `
      display: flex;
      border-bottom: 1px solid ${isDarkMode ? '#3d3d3d' : '#e3e3e3'};
      margin-bottom: 16px;
      overflow-x: auto;
      scrollbar-width: none; /* Firefox */
    `;
    
    // Hide scrollbar for Chrome/Safari/Edge
    tabsNav.addEventListener('mouseenter', () => {
      tabsNav.style.cssText += `
        ::-webkit-scrollbar {
          height: 0;
          background: transparent;
        }
      `;
    });
    
    // Create tab content container
    const tabContent = document.createElement('div');
    tabContent.className = 'engageiq-tab-content';
    
    // Get all tone names
    const tones = Object.keys(comments);
    let activeTab = 0; // Default active tab
    
    // Create tab for each tone
    tones.forEach((tone, index) => {
      // Create tab button
      const tabButton = document.createElement('button');
      tabButton.textContent = this.formatToneName(tone);
      tabButton.dataset.tab = index.toString();
      tabButton.className = index === activeTab ? 'active' : '';
      tabButton.style.cssText = `
        padding: 10px 16px;
        background: none;
        border: none;
        border-bottom: 3px solid ${index === activeTab ? 
          (isDarkMode ? '#0073b1' : '#0a66c2') : 'transparent'};
        color: ${index === activeTab ? 
          (isDarkMode ? '#f5f5f5' : '#0a66c2') : 
          (isDarkMode ? '#a5a5a5' : '#666')};
        font-weight: ${index === activeTab ? '600' : '400'};
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
        flex-shrink: 0;
      `;
      
      // Tab button hover effect
      tabButton.addEventListener('mouseenter', () => {
        if (tabButton.className !== 'active') {
          tabButton.style.color = isDarkMode ? '#d0d0d0' : '#0a66c2';
          tabButton.style.borderBottomColor = isDarkMode ? 'rgba(0, 115, 177, 0.3)' : 'rgba(10, 102, 194, 0.3)';
        }
      });
      
      tabButton.addEventListener('mouseleave', () => {
        if (tabButton.className !== 'active') {
          tabButton.style.color = isDarkMode ? '#a5a5a5' : '#666';
          tabButton.style.borderBottomColor = 'transparent';
        }
      });
      
      // Tab click handler
      tabButton.addEventListener('click', () => {
        // Update active tab
        document.querySelectorAll('.engageiq-tabs-nav button').forEach(btn => {
          (btn as HTMLElement).className = '';
          (btn as HTMLElement).style.fontWeight = '400';
          (btn as HTMLElement).style.color = isDarkMode ? '#a5a5a5' : '#666';
          (btn as HTMLElement).style.borderBottomColor = 'transparent';
        });
        
        tabButton.className = 'active';
        tabButton.style.fontWeight = '600';
        tabButton.style.color = isDarkMode ? '#f5f5f5' : '#0a66c2';
        tabButton.style.borderBottomColor = isDarkMode ? '#0073b1' : '#0a66c2';
        
        // Show selected tab content
        document.querySelectorAll('.engageiq-tab-content > div').forEach(content => {
          (content as HTMLElement).style.display = 'none';
        });
        
        // Fix: Add proper null check and type assertion
        const selectedTab = document.querySelector(`.engageiq-tab-content > div[data-tab="${index}"]`) as HTMLElement | null;
        if (selectedTab) {
          selectedTab.style.display = 'block';
        }
      });
      
      tabsNav.appendChild(tabButton);
      
      // Create tab content
      const tabPane = document.createElement('div');
      tabPane.dataset.tab = index.toString();
      tabPane.style.cssText = `
        display: ${index === activeTab ? 'block' : 'none'};
      `;
      
      // Create comment card for this tone
      const commentText = document.createElement('div');
      commentText.textContent = comments[tone];
      commentText.style.cssText = `
        font-size: 15px;
        line-height: 1.5;
        margin-bottom: 16px;
        white-space: pre-wrap;
        padding: 12px;
        border-radius: 8px;
        background-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'};
      `;
      
      // Button container
      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = `
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-top: 16px;
      `;
      
      // Copy button
      const copyButton = document.createElement('button');
      copyButton.textContent = 'Copy';
      copyButton.style.cssText = `
        background-color: transparent;
        border: 1px solid ${isDarkMode ? '#0073b1' : '#0a66c2'};
        color: ${isDarkMode ? '#0073b1' : '#0a66c2'};
        border-radius: 16px;
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        flex: 1;
        transition: all 0.2s;
      `;
      
      copyButton.addEventListener('mouseenter', () => {
        copyButton.style.backgroundColor = isDarkMode ? 'rgba(0, 115, 177, 0.1)' : 'rgba(10, 102, 194, 0.1)';
      });
      
      copyButton.addEventListener('mouseleave', () => {
        copyButton.style.backgroundColor = 'transparent';
      });
      
      copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(comments[tone]).then(() => {
          const originalText = copyButton.textContent;
          copyButton.textContent = 'Copied!';
          setTimeout(() => {
            copyButton.textContent = originalText;
          }, 2000);
        });
      });
      
      // Use button
      const useButton = document.createElement('button');
      useButton.textContent = 'Use This Comment';
      useButton.style.cssText = `
        background-color: ${isDarkMode ? '#0073b1' : '#0a66c2'};
        color: white;
        border: none;
        border-radius: 16px;
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        flex: 2;
        transition: all 0.2s;
      `;
      
      useButton.addEventListener('mouseenter', () => {
        useButton.style.backgroundColor = isDarkMode ? '#0083c7' : '#0b76df';
      });
      
      useButton.addEventListener('mouseleave', () => {
        useButton.style.backgroundColor = isDarkMode ? '#0073b1' : '#0a66c2';
      });
      
      useButton.addEventListener('click', () => {
        // Use the local message handler instead of sending to background script
        try {
          console.log('⭐ CommentDisplay: Inserting comment directly');
          
          // Use custom event to communicate within content script
          const insertEvent = new CustomEvent('engageiq:insert-comment', {
            detail: {
              comment: comments[tone],
              elementId: fieldId
            },
            bubbles: true
          });
          document.dispatchEvent(insertEvent);
          
          // Restore the Generate Comment button before closing
          const generateButton = document.querySelector(`button[data-field-id="${fieldId}"]`) as HTMLElement;
          if (generateButton) {
            generateButton.style.display = 'block';
            // Use improved tooltip reset method
            this.resetTooltipState(generateButton);
            this.logger.info('Restored Generate Comment button on comment insertion');
          }
          
          // Close the comment UI
          commentsUI.remove();
        } catch (error) {
          console.error('⭐ CommentDisplay: Error inserting comment:', error);
        }
      });
      
      buttonContainer.appendChild(copyButton);
      buttonContainer.appendChild(useButton);
      
      tabPane.appendChild(commentText);
      tabPane.appendChild(buttonContainer);
      tabContent.appendChild(tabPane);
    });
    
    tabsContainer.appendChild(tabsNav);
    tabsContainer.appendChild(tabContent);
    commentsUI.appendChild(tabsContainer);
    
    // Add keyboard handling
    this.setupKeyboardNavigationForTabs(commentsUI, tones.length);
    
    // Add to DOM
    document.body.appendChild(commentsUI);
    
    // Apply visual enhancements - all animations are now handled here
    this.applyPopupVisualEnhancements(commentsUI, isDarkMode);
    
    // Set up a MutationObserver to detect when the popup is removed from the DOM
    // (in case it's removed by any method other than the close button)
    const buttonRestoreObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of Array.from(mutation.removedNodes)) {
            if (node === commentsUI || (node as Element).contains(commentsUI)) {
              // Show the Generate Comment button again
              if (generateButton) {
                this.restoreGenerateButton(generateButton);
                this.logger.info('Restored Generate Comment button on popup removal');
              }
              
              // Disconnect the observer as it's no longer needed
              buttonRestoreObserver.disconnect();
              return;
            }
          }
        }
      }
    });
    
    // Start observing the document body for removed children
    buttonRestoreObserver.observe(document.body, { childList: true, subtree: true });
  }
  
  /**
   * Apply visual enhancements to the popup
   */
  private applyPopupVisualEnhancements(popup: HTMLElement, isDarkMode: boolean): void {
    // Set initial state for animation
    popup.style.opacity = '0';
    popup.style.transform = 'translateY(8px)';
    
    // Add floating appearance
    popup.style.boxShadow = isDarkMode ? 
      '0 10px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)' : 
      '0 10px 30px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)';
    
    // Add subtle border glow for floating effect
    popup.style.boxShadow += isDarkMode ?
      ', 0 0 30px rgba(0, 115, 177, 0.05)' :
      ', 0 0 30px rgba(10, 102, 194, 0.05)';
      
    // Add jiggle animation to indicate draggability
    setTimeout(() => {
      // First make the popup visible
      popup.style.opacity = '1';
      popup.style.transform = 'translateY(0)';
      
      // Then add a slight jiggle animation after the popup is visible
      setTimeout(() => {
        // Add keyframes for the jiggle animation
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
          @keyframes jiggle {
            0% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            50% { transform: translateX(5px); }
            75% { transform: translateX(-3px); }
            100% { transform: translateX(0); }
          }
        `;
        document.head.appendChild(styleSheet);
        
        // Apply the animation
        popup.style.animation = 'jiggle 0.5s ease-in-out 1';
        
        // Remove the animation after it's complete
        setTimeout(() => {
          popup.style.animation = '';
        }, 500);
      }, 300);
    }, 10);
  }
  
  /**
   * Enhanced keyboard navigation for tabbed interface
   */
  private setupKeyboardNavigationForTabs(commentsUI: HTMLElement, numTabs: number): void {
    let currentTabIndex = 0;
    
    const keydownHandler = (e: KeyboardEvent) => {
      // Check if our UI is open
      if (!document.body.contains(commentsUI)) {
        document.removeEventListener('keydown', keydownHandler);
        return;
      }
      
      // Handle escape key to close
      if (e.key === 'Escape') {
        const closeButton = commentsUI.querySelector('button') as HTMLElement;
        if (closeButton) {
          closeButton.click();
        }
        document.removeEventListener('keydown', keydownHandler);
        return;
      }
      
      // Handle tab navigation with arrow keys
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault(); // Prevent scrolling
        
        if (e.key === 'ArrowRight') {
          currentTabIndex = (currentTabIndex + 1) % numTabs;
        } else {
          currentTabIndex = (currentTabIndex - 1 + numTabs) % numTabs;
        }
        
        // Click the tab button
        const tabButton = commentsUI.querySelector(`.engageiq-tabs-nav button[data-tab="${currentTabIndex}"]`) as HTMLElement;
        if (tabButton) {
          tabButton.click();
        }
      }
      
      // Handle Enter key to use currently visible comment
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        const visibleTab = commentsUI.querySelector(`.engageiq-tab-content > div[style*="display: block"]`) as HTMLElement;
        if (visibleTab) {
          const useButton = visibleTab.querySelector('button:last-child') as HTMLElement;
          if (useButton) {
            useButton.click();
            document.removeEventListener('keydown', keydownHandler);
          }
        }
      }
    };
    
    document.addEventListener('keydown', keydownHandler);
    
    // Ensure cleanup when the popup is removed
    const cleanupObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of Array.from(mutation.removedNodes)) {
            if (node === commentsUI || (node as Element).contains(commentsUI)) {
              document.removeEventListener('keydown', keydownHandler);
              cleanupObserver.disconnect();
              return;
            }
          }
        }
      }
    });
    
    // Start observing the document body for when the popup is removed
    cleanupObserver.observe(document.body, { childList: true, subtree: true });
  }
  
  /**
   * Center a popup in the viewport
   * @param popupElement The popup to center
   */
  private centerPopupInViewport(popupElement: HTMLElement): void {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = popupElement.offsetWidth;
    const popupHeight = popupElement.offsetHeight;
    
    // Calculate center position
    const centerLeft = Math.max(0, (viewportWidth - popupWidth) / 2);
    const centerTop = Math.max(0, (viewportHeight - popupHeight) / 2);
    
    // Smoothly animate to center position
    popupElement.style.transition = 'left 0.3s ease-out, top 0.3s ease-out';
    popupElement.style.left = `${centerLeft}px`;
    popupElement.style.top = `${centerTop}px`;
    
    // Reset transition after animation completes
    setTimeout(() => {
      popupElement.style.transition = '';
    }, 300);
    
    this.logger.info('Centered popup in viewport', { centerLeft, centerTop });
  }

  /**
   * Implement drag functionality for the popup
   * @param dragHandle The element that initiates the drag action
   * @param popupElement The popup element to be moved
   */
  private implementDragFunctionality(dragHandle: HTMLElement, popupElement: HTMLElement): void {
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    
    // Add double-click handler to center the popup
    dragHandle.addEventListener('dblclick', (e) => {
      // Only allow double-click from the drag handle
      if (e.target !== dragHandle && !dragHandle.contains(e.target as Node)) {
        return;
      }
      
      // Center the popup
      this.centerPopupInViewport(popupElement);
      e.preventDefault();
    });
    
    const startDrag = (e: MouseEvent) => {
      // Only allow drag from the drag handle
      if (e.target !== dragHandle && !dragHandle.contains(e.target as Node)) {
        return;
      }
      
      isDragging = true;
      
      // Change cursor during drag
      document.body.style.cursor = 'move';
      
      // Highlight popup during drag
      popupElement.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.3)';
      
      // Calculate offset from mouse position to popup top-left corner
      const popupRect = popupElement.getBoundingClientRect();
      offsetX = e.clientX - popupRect.left;
      offsetY = e.clientY - popupRect.top;
      
      // Prevent text selection during drag
      e.preventDefault();
    };
    
    const doDrag = (e: MouseEvent) => {
      if (!isDragging) return;
      
      // Calculate new position
      const newLeft = e.clientX - offsetX;
      const newTop = e.clientY - offsetY;
      
      // Get viewport and popup dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const popupRect = popupElement.getBoundingClientRect();
      const popupWidth = popupRect.width;
      const popupHeight = popupRect.height;
      
      // Ensure popup stays within viewport boundaries
      const boundedLeft = Math.max(0, Math.min(newLeft, viewportWidth - popupWidth));
      const boundedTop = Math.max(0, Math.min(newTop, viewportHeight - popupHeight));
      
      // Update position
      popupElement.style.left = `${boundedLeft}px`;
      popupElement.style.top = `${boundedTop}px`;
    };
    
    const endDrag = () => {
      if (!isDragging) return;
      
      isDragging = false;
      
      // Reset cursor
      document.body.style.cursor = '';
      
      // Reset popup shadow
      popupElement.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';
    };
    
    // Add mouse event listeners
    dragHandle.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', endDrag);
    
    // Set up proper cleanup when the popup is closed
    const cleanupDragListeners = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', endDrag);
      dragHandle.removeEventListener('mousedown', startDrag);
      window.removeEventListener('beforeunload', cleanupDragListeners);
    };
    
    // Add cleanup for when popup is closed via the close button
    const closeButton = popupElement.querySelector('button') as HTMLElement;
    if (closeButton) {
      const originalClickHandler = closeButton.onclick;
      closeButton.onclick = (e) => {
        cleanupDragListeners();
        if (originalClickHandler) {
          return originalClickHandler.call(closeButton, e);
        }
        return true;
      };
    }
    
    // Add cleanup for page navigation/refresh
    window.addEventListener('beforeunload', cleanupDragListeners);
    
    // Add a global mutation observer to detect when the popup is removed from the DOM
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of Array.from(mutation.removedNodes)) {
            if (node === popupElement || (node as Element).contains(popupElement)) {
              cleanupDragListeners();
              observer.disconnect();
              return;
            }
          }
        }
      }
    });
    
    // Observe document.body to catch any DOM changes
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  /**
   * Create each length option button and group them
   */
  private createLengthButtons(lengthOptions: CommentLength[], container: HTMLElement, isDarkMode: boolean, fieldId: string, commentsUI: HTMLElement): HTMLButtonElement[] {
    const optionsContainer = document.createElement('div');
    optionsContainer.style.cssText = `
      display: flex;
      justify-content: space-between;
      gap: 8px;
    `;
    
    const buttons: HTMLButtonElement[] = [];
    
    this.debugLog('Creating length buttons. Current selected length:', this.selectedLength);
    
    // Create each length option button
    lengthOptions.forEach(length => {
      const option = document.createElement('button');
      const displayName = this.formatLengthName(length);
      option.textContent = displayName;
      option.dataset.length = length; // Store the length value directly in the button
      
      // Use the current selected length to determine which button is active
      const isSelected = length === this.selectedLength;
      this.debugLog(`Button "${displayName}" isSelected:`, isSelected, 'length:', length, 'selectedLength:', this.selectedLength);
      
      // Apply proper styling for the selected option
      this.applyButtonStyle(option, isSelected, isDarkMode);
      
      option.addEventListener('click', () => {
        const previousLength = this.selectedLength;
        this.selectedLength = length;
        
        this.debugLog(`Button clicked: ${displayName}. Previous length: ${previousLength}, New length: ${this.selectedLength}`);
        
        // Only regenerate if the selection actually changed
        if (previousLength !== length) {
          this.debugLog('Selection changed, updating buttons and regenerating...');
          
          // Update all buttons' visual styles to reflect the new selection
          buttons.forEach(btn => {
            // Get length directly from data attribute
            const btnLength = btn.dataset.length as CommentLength;
            const shouldBeSelected = btnLength === length;
            this.debugLog(`Updating button "${btn.textContent}": shouldBeSelected=${shouldBeSelected}, btnLength=${btnLength}, targetLength=${length}`);
            this.applyButtonStyle(btn, shouldBeSelected, isDarkMode);
          });
          
          // Store in localStorage immediately as a fallback
          try {
            localStorage.setItem('engageiq_last_selected_length', length);
            this.debugLog('Stored immediate selection in localStorage:', length);
          } catch (e) {
            this.debugLog('Error storing selection in localStorage:', e);
          }
          
          // Changes only affect the current popup instance
          // and won't change the saved user preference
          
          // Generate new comments with the temporary length selection
          this.regenerateComments(fieldId, commentsUI);
        } else {
          this.debugLog('Selection did not change, no update needed');
        }
      });
      
      buttons.push(option);
      optionsContainer.appendChild(option);
    });
    
    container.appendChild(optionsContainer);
    return buttons;
  }
  
  /**
   * Create length preference selector UI
   * @param isDarkMode Whether dark mode is active
   * @param fieldId The ID of the comment field
   * @param commentsUI The comments UI container element
   * @returns HTMLElement containing the length preference UI
   */
  private createLengthPreferenceSelector(isDarkMode: boolean, fieldId: string, commentsUI: HTMLElement): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid ${isDarkMode ? '#424242' : '#e0e0e0'};
    `;
    
    // Label
    const label = document.createElement('div');
    label.textContent = 'Comment Length:';
    label.style.cssText = `
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 8px;
      color: ${isDarkMode ? '#dfdfdf' : '#666'};
    `;
    container.appendChild(label);
    
    // Add a debug section if in debug mode
    if (this._debugMode) {
      const debugSection = document.createElement('div');
      debugSection.style.cssText = `
        font-size: 11px;
        margin-bottom: 8px;
        color: ${isDarkMode ? '#dfdfdf' : '#666'};
        background: ${isDarkMode ? '#3a3a3a' : '#f0f0f0'};
        padding: 4px;
        border-radius: 4px;
      `;
      
      // Add a timestamp to see when the UI is refreshed
      const now = new Date();
      const timestamp = now.toLocaleTimeString() + '.' + now.getMilliseconds();
      
      debugSection.textContent = `Selected: ${this.selectedLength}, Saved: ${this.savedUserPreference}, Regenerating: ${this._isRegenerating}, Pending: ${this._pendingLengthSelection}, Time: ${timestamp}`;
      container.appendChild(debugSection);
    }
    
    // Create all length option buttons
    const lengthOptions: CommentLength[] = ['very_short', 'short', 'medium', 'long', 'very_long'];
    const buttons = this.createLengthButtons(lengthOptions, container, isDarkMode, fieldId, commentsUI);
    
    // Add debug refresh button
    if (this._debugMode) {
      this.addDebugRefreshButton(container, buttons, isDarkMode);
    }
    
    // Add Save as Default button
    const saveDefaultSection = document.createElement('div');
    saveDefaultSection.style.cssText = `
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
    `;
    
    const saveDefaultButton = document.createElement('button');
    saveDefaultButton.textContent = 'Save as Default';
    saveDefaultButton.style.cssText = `
      background-color: transparent;
      border: 1px solid ${isDarkMode ? '#0073b1' : '#0a66c2'};
      color: ${isDarkMode ? '#0073b1' : '#0a66c2'};
      border-radius: 16px;
      padding: 4px 10px;
      font-size: 11px;
      cursor: pointer;
    `;
    
    saveDefaultButton.addEventListener('click', () => {
      // Save the current temporary preference as the permanent one
      this.saveLengthPreference(this.selectedLength);
      
      // Show feedback
      const originalText = saveDefaultButton.textContent;
      saveDefaultButton.textContent = 'Saved!';
      setTimeout(() => {
        saveDefaultButton.textContent = originalText;
      }, 2000);
    });
    
    saveDefaultSection.appendChild(saveDefaultButton);
    container.appendChild(saveDefaultSection);
    
    return container;
  }
  
  /**
   * Apply styling to a button based on selection state
   * @param button The button element to style
   * @param isSelected Whether the button is selected
   * @param isDarkMode Whether dark mode is active
   */
  private applyButtonStyle(button: HTMLButtonElement, isSelected: boolean, isDarkMode: boolean): void {
    button.style.backgroundColor = isSelected 
      ? (isDarkMode ? '#0073b1' : '#0a66c2') 
      : (isDarkMode ? '#283339' : '#f5f5f5');
    button.style.color = isSelected 
      ? 'white' 
      : (isDarkMode ? '#a5a5a5' : '#666');
    button.style.borderColor = isSelected 
      ? (isDarkMode ? '#0073b1' : '#0a66c2') 
      : (isDarkMode ? '#424242' : '#e0e0e0');
    button.style.border = `1px solid ${button.style.borderColor}`;
    button.style.borderRadius = '16px';
    button.style.padding = '5px 0';
    button.style.fontSize = '12px';
    button.style.fontWeight = '500';
    button.style.cursor = 'pointer';
    button.style.flex = '1';
    button.style.textAlign = 'center';
    button.style.transition = 'all 0.2s ease';
  }
  
  /**
   * Format length name for display
   * @param length The length option to format
   * @returns Formatted display name
   */
  private formatLengthName(length: CommentLength): string {
    return length.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  }
  
  /**
   * Format tone name for display
   */
  private formatToneName(tone: string): string {
    return tone.charAt(0).toUpperCase() + tone.slice(1) + ' tone';
  }
  
  /**
   * Regenerate comments with a new length preference
   * @param fieldId ID of the comment field
   * @param commentsUI The current comments UI container
   */
  private regenerateComments(fieldId: string, commentsUI: HTMLElement): void {
    this.logger.info('Regenerating comments with new length preference', { 
      length: this.selectedLength,
      fieldId 
    });
    
    // Store the current length preference to ensure it's preserved during regeneration
    const currentLength = this.selectedLength;
    this.debugLog('regenerateComments - Starting regeneration with length:', currentLength);
    
    // CRITICAL: Set a global variable to remember our selection
    // This is a last resort if all other mechanisms fail
    try {
      (window as any).__engageiq_last_length_selection = currentLength;
      this.debugLog('Set global variable with length:', currentLength);
    } catch (e) {
      this.debugLog('Error setting global variable:', e);
    }
    
    // Store the pending length selection
    this._pendingLengthSelection = currentLength;
    
    // Also store in localStorage as a fallback mechanism
    try {
      localStorage.setItem('engageiq_temp_length', currentLength);
      localStorage.setItem('engageiq_last_selected_length', currentLength);
      this.debugLog('Stored selection in localStorage:', currentLength);
    } catch (e) {
      this.debugLog('Error storing in localStorage:', e);
    }
    
    // Set flag to indicate we're in the middle of regeneration
    this._isRegenerating = true;
    
    // Show loading state
    this.showLoadingState(commentsUI);
    
    // Extract post content from the field (or its closest parent post)
    const field = document.getElementById(fieldId);
    if (!field) {
      this.logger.warn('Field not found for regeneration', { fieldId });
      this._isRegenerating = false;
      this._pendingLengthSelection = null;
      return;
    }
    
    // Find closest post containing this comment field (simplified extraction)
    const post = field.closest('.feed-shared-update-v2') || 
                field.closest('article') || 
                field.closest('.ember-view.occludable-update');
    
    if (!post) {
      this.logger.info('Could not find post for comment field');
      this._isRegenerating = false;
      this._pendingLengthSelection = null;
      return;
    }
    
    // Extract basic post content (simplified)
    const textElement = post.querySelector('.feed-shared-update-v2__description-wrapper') || 
                      post.querySelector('.update-components-text');
    
    const postText = textElement ? textElement.textContent?.trim() : 'No text content found';
    
    // Extract author info
    const authorElement = post.querySelector('.feed-shared-actor__name') || 
                         post.querySelector('.update-components-actor__name');
    
    const author = authorElement ? authorElement.textContent?.trim() : 'Unknown author';
    
    const postContent = {
      author,
      text: postText,
      url: window.location.href
    };
    
    // Also add a "force update" tag to ensure it's applied in case our message listener fails
    try {
      const forceUpdateTag = document.createElement('div');
      forceUpdateTag.id = 'engageiq-force-selection-update';
      forceUpdateTag.style.display = 'none';
      forceUpdateTag.dataset.length = currentLength;
      // Add a flag to center the next popup
      forceUpdateTag.dataset.centerPopup = 'true';
      
      // Remove any existing tag
      const existingTag = document.getElementById('engageiq-force-selection-update');
      if (existingTag) {
        existingTag.remove();
      }
      
      // Add the new tag
      document.body.appendChild(forceUpdateTag);
      this.debugLog('Added force update tag for selection:', currentLength);
    } catch (e) {
      this.debugLog('Could not add force update tag:', e);
    }
    
    // Send message to background script to generate comment with new length
    // Use the temporary selected length for this request, but don't modify the saved preference
    try {
      chrome.runtime.sendMessage({
        type: 'GENERATE_COMMENT',
        payload: {
          fieldId: fieldId,
          postContent,
          options: {
            tone: 'all',
            length: currentLength // Using temporary length preference
          }
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          this.handleContextInvalidation(commentsUI, 'Error generating comment: ' + chrome.runtime.lastError.message);
          return;
        }
        
        this.logger.info('Regenerated comment response:', response);
        
        this.debugLog('Regeneration complete - Setting selectedLength to:', currentLength);
        // Ensure the selected length is preserved for the next UI display
        this.selectedLength = currentLength;
        
        // Reset regeneration flag after response
        this._isRegenerating = false;
        
        // Remove the current UI since we'll show a new one when we get the COMMENT_GENERATED message
        commentsUI.remove();
      });
    } catch (error) {
      this.handleContextInvalidation(commentsUI, 'Failed to send message to background script');
    }
  }
  
  /**
   * Show loading state in the comments UI
   * @param commentsUI The comments UI container
   */
  private showLoadingState(commentsUI: HTMLElement): void {
    // Find the content area or create one if it doesn't exist
    let content = commentsUI.querySelector('div:not(:first-child)');
    if (!content) {
      content = document.createElement('div');
      commentsUI.appendChild(content);
    }
    
    // Clear existing content
    content.innerHTML = '';
    
    // Add loading indicator
    const loadingElement = document.createElement('div');
    loadingElement.textContent = 'Generating new suggestions...';
    loadingElement.style.cssText = `
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 14px;
    `;
    
    // Add spinner
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      border: 3px solid #f3f3f3;
      border-top: 3px solid #0a66c2;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      animation: spin 2s linear infinite;
      margin: 10px auto;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    loadingElement.prepend(spinner);
    content.appendChild(loadingElement);
  }

  /**
   * Validate a length string is a valid CommentLength
   */
  private isValidLength(length: string): boolean {
    return ['very_short', 'short', 'medium', 'long', 'very_long'].includes(length);
  }
  
  /**
   * Reset tooltip state to ensure it's hidden
   * @param button The button element containing the tooltip
   */
  private resetTooltipState(button: HTMLElement): void {
    // First try to find the tooltip within any span element
    let tooltip = button.querySelector('span') as HTMLElement;
    
    // If not found, look for any span within a div inside the button
    if (!tooltip || tooltip.textContent !== 'Generate Comment') {
      const buttonContent = button.querySelector('div');
      if (buttonContent) {
        tooltip = buttonContent.querySelector('span[style*="position: absolute"]') as HTMLElement;
      }
    }
    
    // If a tooltip was found, hide it
    if (tooltip) {
      tooltip.style.opacity = '0';
      tooltip.style.visibility = 'hidden';
    }
  }

  /**
   * Restore the "Generate Comment" button when popup is closed
   * @param button The button to restore
   */
  private restoreGenerateButton(button: HTMLElement): void {
    if (!button) return;
    
    // Always start with display:block to ensure visibility
    button.style.display = 'block';
    
    // Ensure all critical styles are set directly
    button.style.backgroundColor = '#0a66c2';
    button.style.color = 'white';
    button.style.cursor = 'pointer';
    button.style.opacity = '1';
    button.style.zIndex = '9999';
    button.style.position = 'absolute';
    button.style.width = '32px';
    button.style.height = '32px';
    button.style.borderRadius = '50%';
    button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    
    // Reset any transform that might have been applied
    button.style.transform = 'scale(1)';
    
    // Ensure tooltip is hidden
    this.resetTooltipState(button);
    
    this.logger.info('Fully restored Generate Comment button');
  }

  /**
   * Add a debug button to force refresh styling
   */
  private addDebugRefreshButton(container: HTMLElement, buttons: HTMLButtonElement[], isDarkMode: boolean): void {
    if (!this._debugMode) return;
    
    const debugButtonContainer = document.createElement('div');
    debugButtonContainer.style.cssText = `
      margin-top: 10px;
      text-align: center;
    `;
    
    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Debug: Refresh Buttons';
    refreshButton.style.cssText = `
      background-color: ${isDarkMode ? '#ff5722' : '#ff9800'};
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 10px;
      cursor: pointer;
    `;
    
    refreshButton.addEventListener('click', () => {
      this.debugLog('Debug refresh clicked, current selectedLength:', this.selectedLength);
      
      buttons.forEach(btn => {
        const btnLength = btn.dataset.length as CommentLength;
        const shouldBeSelected = btnLength === this.selectedLength;
        this.debugLog(`Refreshing button "${btn.textContent}": shouldBeSelected=${shouldBeSelected}, btnLength=${btnLength}`);
        this.applyButtonStyle(btn, shouldBeSelected, isDarkMode);
      });
    });
    
    debugButtonContainer.appendChild(refreshButton);
    container.appendChild(debugButtonContainer);
  }

  /**
   * Handle extension context invalidation
   * @param commentsUI The current comments UI container
   * @param errorMessage The error message to display
   */
  private handleContextInvalidation(commentsUI: HTMLElement, errorMessage: string): void {
    this.logger.error(errorMessage);
    
    // Reset flags
    this._isRegenerating = false;
    this._pendingLengthSelection = null;
    
    // Show error in the UI
    const errorContainer = document.createElement('div');
    errorContainer.style.cssText = `
      padding: 16px;
      color: #d32f2f;
      background-color: #ffebee;
      border-radius: 4px;
      margin: 16px 0;
      text-align: center;
    `;
    
    const errorTitle = document.createElement('div');
    errorTitle.textContent = 'Extension Context Error';
    errorTitle.style.cssText = `
      font-weight: 600;
      margin-bottom: 8px;
    `;
    
    const errorText = document.createElement('div');
    errorText.textContent = 'The extension context has been invalidated. Please refresh the page and try again.';
    errorText.style.cssText = `
      font-size: 14px;
      margin-bottom: 12px;
    `;
    
    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Refresh Page';
    refreshButton.style.cssText = `
      background-color: #d32f2f;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 14px;
      cursor: pointer;
    `;
    
    refreshButton.addEventListener('click', () => {
      window.location.reload();
    });
    
    errorContainer.appendChild(errorTitle);
    errorContainer.appendChild(errorText);
    errorContainer.appendChild(refreshButton);
    
    // Clear content and show error
    commentsUI.innerHTML = '';
    commentsUI.appendChild(errorContainer);
  }
}