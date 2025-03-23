# System Patterns

## System Architecture

The extension uses a content script to inject the comment section into web pages. The background script manages communication and data storage.

## Key Technical Decisions

Using React for the UI components, storing comments in local storage.

## Design Patterns in Use

Message passing between content script and background script.

## Component Relationships

Content script injects CommentDisplay and CommentFieldEnhancer into web pages. The background script handles messages from the content script and manages local storage.
