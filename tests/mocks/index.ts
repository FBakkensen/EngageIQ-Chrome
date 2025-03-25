/**
 * Main exports file for all mocks
 * This file allows importing from one central location: @tests/mocks
 */

// Re-export all specific mock categories
export * from './chrome';
export * from './dom';
export * from './api';
export * from './services';

// Utility mocks for assets
export const fileMock = 'test-file-stub';
export const styleMock = {}; 