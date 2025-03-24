// We'll create mock path strings instead of actual imports to test our configuration
const cssPath = 'mock.css';
const imagePath = 'mock.jpg';

// Access Jest's moduleNameMapper to verify our configuration
const jestConfig = require('../jest.config');

describe('Mock configuration test', () => {
  it('should have moduleNameMapper configured', () => {
    expect(jestConfig.moduleNameMapper).toBeDefined();
  });

  it('should have path alias mapping configured', () => {
    const aliasPattern = Object.keys(jestConfig.moduleNameMapper).find(pattern => 
      pattern.includes('@/'));
    expect(aliasPattern).toBeDefined();
  });

  it('should have CSS mock configured', () => {
    const cssPattern = Object.keys(jestConfig.moduleNameMapper).find(pattern => 
      pattern.includes('css'));
    expect(cssPattern).toBeDefined();
  });

  it('should have file mock configured', () => {
    const filePattern = Object.keys(jestConfig.moduleNameMapper).find(pattern => 
      pattern.includes('jpg'));
    expect(filePattern).toBeDefined();
  });
}); 