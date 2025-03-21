/**
 * Service for detecting LinkedIn theme (dark/light mode)
 */
export class ThemeDetector {
  /**
   * Check if LinkedIn is in dark mode
   * @returns True if dark mode is active
   */
  isDarkMode(): boolean {
    return document.documentElement.getAttribute('data-theme') === 'dark' || 
           document.body.classList.contains('theme--dark') ||
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  /**
   * Get the current theme colors
   * @returns Object with color values for current theme
   */
  getThemeColors(): { background: string, text: string, primary: string, secondary: string } {
    const isDark = this.isDarkMode();
    
    return {
      background: isDark ? '#1d2226' : 'white',
      text: isDark ? '#f5f5f5' : '#1d2226',
      primary: isDark ? '#0073b1' : '#0a66c2',
      secondary: isDark ? '#283339' : '#f5f5f5'
    };
  }
}