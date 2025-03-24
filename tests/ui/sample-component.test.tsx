// tests/ui/sample-component.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple test component
const TestComponent: React.FC = () => (
  <div data-testid="test-component">
    <h1>Test Component</h1>
    <p>This is a test component to verify the DOM testing environment.</p>
  </div>
);

describe('DOM Environment Setup', () => {
  it('renders a React component correctly', () => {
    render(<TestComponent />);
    
    const component = screen.getByTestId('test-component');
    expect(component).toBeInTheDocument();
    expect(component).toHaveTextContent('Test Component');
    expect(component).toHaveTextContent('This is a test component to verify the DOM testing environment.');
  });

  it('uses LinkedIn mocks correctly', () => {
    // Test the LinkedIn-specific DOM mocks
    const postElement = linkedInMocks.createPostElement();
    const commentField = linkedInMocks.createCommentField();
    
    document.body.appendChild(postElement);
    document.body.appendChild(commentField);
    
    expect(document.querySelector('.feed-shared-update-v2')).toBeInTheDocument();
    expect(document.querySelector('.comments-comment-box')).toBeInTheDocument();
    expect(document.querySelector('.ql-editor')).toBeInTheDocument();

    // Clean up
    document.body.removeChild(postElement);
    document.body.removeChild(commentField);
  });
}); 