import { PostDetector } from '@/content/services/PostDetector';

describe('Import alias test', () => {
  it('should correctly import using @ alias', () => {
    // If this test runs without import errors, the alias configuration works
    expect(PostDetector).toBeDefined();
  });
}); 