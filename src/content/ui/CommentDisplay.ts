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
    
    // Create the comments UI container - now wider and floating
    const commentsUI = document.createElement('div');
    commentsUI.className = 'engageiq-comments-ui';
    commentsUI.style.cssText = `
      position: fixed;
      width: 480px;
      max-width: 90vw;
      background-color: ${isDarkMode ? '#1d2226' : 'white'};
      color: ${isDarkMode ? '#f5f5f5' : '#1d2226'};
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      padding: 16px;
      max-height: 80vh;
      overflow-y: auto;
      font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      transition: box-shadow 0.2s;
      border: 1px solid ${isDarkMode ? '#3d3d3d' : '#e3e3e3'};
    `;
    
    // Position the comments UI
    const fieldRect = field.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = 480; // Match width from CSS above
    
    // Calculate initial position to ensure it's visible
    let initialTop = fieldRect.bottom + 8;
    let initialLeft = Math.max(4, Math.min(fieldRect.left, viewportWidth - popupWidth - 4));
    
    // Adjust vertical position if near bottom of viewport
    if (initialTop + 300 > viewportHeight) { // 300px is an estimated minimum height
      initialTop = Math.max(8, viewportHeight - 300 - 8);
    }
    
    // Set initial position
    commentsUI.style.top = `${initialTop}px`;
    commentsUI.style.left = `${initialLeft}px`;
    
    // Create header with drag handle styling
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      cursor: move;
      padding-bottom: 8px;
      border-bottom: 1px solid ${isDarkMode ? '#3d3d3d' : '#e3e3e3'};
    `;
    
    // Add drag indicator to visually show it's draggable
    const dragIndicator = document.createElement('div');
    dragIndicator.style.cssText = `
      display: flex;
      align-items: center;
      gap: 2px;
    `;
    
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.style.cssText = `
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background-color: ${isDarkMode ? '#8e8e8e' : '#8e8e8e'};
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
      font-size: 20px;
      cursor: pointer;
      color: ${isDarkMode ? '#f5f5f5' : '#1d2226'};
      padding: 4px 8px;
    `;
    
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
    
    // Create content
    const content = document.createElement('div');
    
    // Add each comment
    for (const tone in comments) {
      const commentCard = this.createCommentCard(comments[tone], tone, isDarkMode, fieldId, commentsUI);
      content.appendChild(commentCard);
    }
    
    commentsUI.appendChild(content);
    
    // Add keyboard handling
    this.setupKeyboardNavigation(commentsUI);
    
    // Add to DOM
    document.body.appendChild(commentsUI);
    
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
    
    // Visual enhancement on popup appearance
    setTimeout(() => {
      commentsUI.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';
    }, 50);
    
    // Double-check button selection after rendering
    setTimeout(() => {
      this.doubleCheckButtonSelection(commentsUI);
    }, 50);
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
   * Double-check button selection to ensure the UI correctly reflects the selected length
   * This is a safety measure in case other mechanisms failed
   */
  private doubleCheckButtonSelection(commentsUI: HTMLElement): void {
    try {
      const buttons = commentsUI.querySelectorAll('button[data-length]');
      if (buttons.length === 0) {
        this.debugLog('No length buttons found for double-check');
        return;
      }
      
      this.debugLog('Double-checking button selection, current selectedLength:', this.selectedLength);
      let correctButtonFound = false;
      
      buttons.forEach((btn) => {
        const btnLength = (btn as HTMLButtonElement).dataset.length as CommentLength;
        const shouldBeSelected = btnLength === this.selectedLength;
        
        // Check if button style matches expected selection state
        const isCurrentlySelected = (btn as HTMLButtonElement).style.backgroundColor.includes('0a66c2') || 
                                   (btn as HTMLButtonElement).style.backgroundColor.includes('0073b1');
        
        if (shouldBeSelected !== isCurrentlySelected) {
          this.debugLog(`Button selection mismatch for "${(btn as HTMLButtonElement).textContent}": ` +
                        `should be ${shouldBeSelected}, is ${isCurrentlySelected}`);
          
          // Fix the button style
          const isDarkMode = this.themeDetector.isDarkMode();
          this.applyButtonStyle(btn as HTMLButtonElement, shouldBeSelected, isDarkMode);
          this.debugLog(`Fixed button style for "${(btn as HTMLButtonElement).textContent}"`);
        }
        
        if (shouldBeSelected) {
          correctButtonFound = true;
        }
      });
      
      this.debugLog('Button selection double-check complete, correctButtonFound:', correctButtonFound);
    } catch (e) {
      this.debugLog('Error double-checking button selection:', e);
    }
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
   * Create a card for a single comment
   */
  private createCommentCard(
    comment: string, 
    tone: string, 
    isDarkMode: boolean, 
    fieldId: string,
    commentsUI: HTMLElement
  ): HTMLElement {
    const card = document.createElement('div');
    card.style.cssText = `
      background-color: ${isDarkMode ? '#283339' : '#f5f5f5'};
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
    `;
    
    // Tone label
    const toneLabel = document.createElement('div');
    toneLabel.textContent = this.formatToneName(tone);
    toneLabel.style.cssText = `
      font-size: 12px;
      font-weight: 600;
      color: ${isDarkMode ? '#a5a5a5' : '#666'};
      margin-bottom: 8px;
      text-transform: capitalize;
    `;
    
    // Comment text
    const commentText = document.createElement('div');
    commentText.textContent = comment;
    commentText.style.cssText = `
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 12px;
      white-space: pre-wrap;
    `;
    
    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      justify-content: space-between;
      gap: 8px;
    `;
    
    // Copy button
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    copyButton.style.cssText = `
      background-color: transparent;
      border: 1px solid ${isDarkMode ? '#0073b1' : '#0a66c2'};
      color: ${isDarkMode ? '#0073b1' : '#0a66c2'};
      border-radius: 16px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      flex: 1;
    `;
    
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(comment).then(() => {
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
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      flex: 2;
    `;
    
    useButton.addEventListener('click', () => {
      // Use the local message handler instead of sending to background script
      try {
        console.log('⭐ CommentDisplay: Inserting comment directly');
        
        // Use custom event to communicate within content script
        const insertEvent = new CustomEvent('engageiq:insert-comment', {
          detail: {
            comment,
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
    
    card.appendChild(toneLabel);
    card.appendChild(commentText);
    card.appendChild(buttonContainer);
    
    return card;
  }
  
  /**
   * Format tone name for display
   */
  private formatToneName(tone: string): string {
    return tone.charAt(0).toUpperCase() + tone.slice(1) + ' tone';
  }
  
  /**
   * Set up keyboard navigation for the comments UI
   */
  private setupKeyboardNavigation(commentsUI: HTMLElement): void {
    document.addEventListener('keydown', (e) => {
      // Check if our UI is open
      if (!document.body.contains(commentsUI)) {
        return;
      }
      
      // Handle escape key to close
      if (e.key === 'Escape') {
        commentsUI.remove();
      }
    });
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
      this.logger.info('Regenerated comment response:', response);
      
      this.debugLog('Regeneration complete - Setting selectedLength to:', currentLength);
      // Ensure the selected length is preserved for the next UI display
      this.selectedLength = currentLength;
      
      // Reset regeneration flag after response
      this._isRegenerating = false;
      
      // Remove the current UI since we'll show a new one when we get the COMMENT_GENERATED message
      commentsUI.remove();
    });
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
}