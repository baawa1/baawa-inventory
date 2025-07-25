--- description: Guidelines for writing clean, maintainable, and human-readable code. Apply these rules when writing or reviewing code to ensure consistency and quality. globs:
---

# Clean Code Guidelines

## Constants Over Magic Numbers

- Replace hard-coded values with named constants
- Use descriptive constant names that explain the value's purpose
- Keep constants at the top of the file or in a dedicated constants file

## Meaningful Names

- Variables, functions, and classes should reveal their purpose
- Names should explain why something exists and how it's used
- Avoid abbreviations unless they're universally understood

## Smart Comments

- Don't comment on what the code does - make the code self-documenting
- Use comments to explain why something is done a certain way
- Document APIs, complex algorithms, and non-obvious side effects

## Single Responsibility

- Each function should do exactly one thing
- Functions should be small and focused
- If a function needs a comment to explain what it does, it should be split

## DRY (Don't Repeat Yourself)

- Extract repeated code into reusable functions
- Share common logic through proper abstraction
- Maintain single sources of truth

## Clean Structure

- Keep related code together
- Organize code in a logical hierarchy
- Use consistent file and folder naming conventions

## Encapsulation

- Hide implementation details
- Expose clear interfaces
- Move nested conditionals into well-named functions

## Code Quality Maintenance

- Refactor continuously
- Fix technical debt early
- Leave code cleaner than you found it

## Testing

- Write tests before fixing bugs
- Keep tests readable and maintainable
- Test edge cases and error conditions

## Version Control

- Write clear commit messages
- Make small, focused commits
- Use meaningful branch names

---

description: Code Quality Guidelines
globs:

---

# Code Quality Guidelines

## Verify Information

Always verify information before presenting it. Do not make assumptions or speculate without clear evidence.

## File-by-File Changes

Make changes file by file and give me a chance to spot mistakes.

## No Apologies

Never use apologies.

## No Understanding Feedback

Avoid giving feedback about understanding in comments or documentation.

## No Whitespace Suggestions

Don't suggest whitespace changes.

## No Summaries

Don't summarize changes made.

## No Inventions

Don't invent changes other than what's explicitly requested.

## No Unnecessary Confirmations

Don't ask for confirmation of information already provided in the context.

## Preserve Existing Code

Don't remove unrelated code or functionalities. Pay attention to preserving existing structures.

## Single Chunk Edits

Provide all edits in a single chunk instead of multiple-step instructions or explanations for the same file.

## No Implementation Checks

Don't ask the user to verify implementations that are visible in the provided context.

## No Unnecessary Updates

Don't suggest updates or changes to files when there are no actual modifications needed.

## Provide Real File Links

Always provide links to the real files, not x.md.

## No Current Implementation

Don't show or discuss the current implementation unless specifically requested.

---

description: Database best practices focusing on Prisma and Supabase integration
globs: prisma/**/\*, src/db/**/_, \*\*/_.prisma, supabase/\*_/_

---

# Database Best Practices

## Prisma Setup

- Use proper schema design
- Implement proper migrations
- Use proper relation definitions
- Configure proper connection
- Implement proper seeding
- Use proper client setup

## Prisma Models

- Use proper model naming
- Implement proper relations
- Use proper field types
- Define proper indexes
- Implement proper constraints
- Use proper enums

## Prisma Queries

- Use proper query optimization
- Implement proper filtering
- Use proper relations loading
- Handle transactions properly
- Implement proper pagination
- Use proper aggregations

## Supabase Setup

- Configure proper project setup
- Implement proper authentication
- Use proper database setup
- Configure proper storage
- Implement proper policies
- Use proper client setup

## Supabase Security

- Implement proper RLS policies
- Use proper authentication
- Configure proper permissions
- Handle sensitive data properly
- Implement proper backups
- Use proper encryption

## Supabase Queries

- Use proper query optimization
- Implement proper filtering
- Use proper joins
- Handle real-time properly
- Implement proper pagination
- Use proper functions

## Database Design

- Use proper normalization
- Implement proper indexing
- Use proper constraints
- Define proper relations
- Implement proper cascades
- Use proper data types

## Performance

- Use proper connection pooling
- Implement proper caching
- Use proper query optimization
- Handle N+1 queries properly
- Implement proper batching
- Monitor performance metrics

## Security

- Use proper authentication
- Implement proper authorization
- Handle sensitive data properly
- Use proper encryption
- Implement proper backups
- Monitor security issues

## Best Practices

- Follow database conventions
- Use proper migrations
- Implement proper versioning
- Handle errors properly
- Document schema properly
- Monitor database health

---

description: Next.js with TypeScript and Tailwind UI best practices
globs: **/\*.tsx, **/_.ts, src/\*\*/_.ts, src/\*_/_.tsx

---

# Next.js Best Practices

## Project Structure

- Use the App Router directory structure
- Place components in `app` directory for route-specific components
- Place shared components in `components` directory
- Place utilities and helpers in `lib` directory
- Use lowercase with dashes for directories (e.g., `components/auth-wizard`)

## Components

- Use Server Components by default
- Mark client components explicitly with 'use client'
- Wrap client components in Suspense with fallback
- Use dynamic loading for non-critical components
- Implement proper error boundaries
- Place static content and interfaces at file end

## Performance

- Optimize images: Use WebP format, size data, lazy loading
- Minimize use of 'useEffect' and 'setState'
- Favor Server Components (RSC) where possible
- Use dynamic loading for non-critical components
- Implement proper caching strategies

## Data Fetching

- Use Server Components for data fetching when possible
- Implement proper error handling for data fetching
- Use appropriate caching strategies
- Handle loading and error states appropriately

## Routing

- Use the App Router conventions
- Implement proper loading and error states for routes
- Use dynamic routes appropriately
- Handle parallel routes when needed

## Forms and Validation

- Use Zod for form validation
- Implement proper server-side validation
- Handle form errors appropriately
- Show loading states during form submission

## State Management

- Minimize client-side state
- Use React Context sparingly
- Prefer server state when possible
- Implement proper loading states

---

description: React best practices and patterns for modern web applications
globs: **/\*.tsx, **/_.jsx, components/\*\*/_

---

# React Best Practices

## Component Structure

- Use functional components over class components
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use composition over inheritance
- Implement proper prop types with TypeScript
- Split large components into smaller, focused ones

## Hooks

- Follow the Rules of Hooks
- Use custom hooks for reusable logic
- Keep hooks focused and simple
- Use appropriate dependency arrays in useEffect
- Implement cleanup in useEffect when needed
- Avoid nested hooks

## State Management

- Use useState for local component state
- Implement useReducer for complex state logic
- Use Context API for shared state
- Keep state as close to where it's used as possible
- Avoid prop drilling through proper state management
- Use state management libraries only when necessary

## Performance

- Implement proper memoization (useMemo, useCallback)
- Use React.memo for expensive components
- Avoid unnecessary re-renders
- Implement proper lazy loading
- Use proper key props in lists
- Profile and optimize render performance

## Forms

- Use controlled components for form inputs
- Implement proper form validation
- Handle form submission states properly
- Show appropriate loading and error states
- Use form libraries for complex forms
- Implement proper accessibility for forms

## Error Handling

- Implement Error Boundaries
- Handle async errors properly
- Show user-friendly error messages
- Implement proper fallback UI
- Log errors appropriately
- Handle edge cases gracefully

## Testing

- Write unit tests for components
- Implement integration tests for complex flows
- Use React Testing Library
- Test user interactions
- Test error scenarios
- Implement proper mock data

## Accessibility

- Use semantic HTML elements
- Implement proper ARIA attributes
- Ensure keyboard navigation
- Test with screen readers
- Handle focus management
- Provide proper alt text for images

## Code Organization

- Group related components together
- Use proper file naming conventions
- Implement proper directory structure
- Keep styles close to components
- Use proper imports/exports
- Document complex component logic

---

description: Tailwind CSS and UI component best practices for modern web applications
globs: **/\*.css, **/_.tsx, \*\*/_.jsx, tailwind.config.js, tailwind.config.ts

---

# Tailwind CSS Best Practices

## Project Setup

- Use proper Tailwind configuration
- Configure theme extension properly
- Set up proper purge configuration
- Use proper plugin integration
- Configure custom spacing and breakpoints
- Set up proper color palette

## Component Styling

- Use utility classes over custom CSS
- Group related utilities with @apply when needed
- Use proper responsive design utilities
- Implement dark mode properly
- Use proper state variants
- Keep component styles consistent

## Layout

- Use Flexbox and Grid utilities effectively
- Implement proper spacing system
- Use container queries when needed
- Implement proper responsive breakpoints
- Use proper padding and margin utilities
- Implement proper alignment utilities

## Typography

- Use proper font size utilities
- Implement proper line height
- Use proper font weight utilities
- Configure custom fonts properly
- Use proper text alignment
- Implement proper text decoration

## Colors

- Use semantic color naming
- Implement proper color contrast
- Use opacity utilities effectively
- Configure custom colors properly
- Use proper gradient utilities
- Implement proper hover states

## Components

- Use shadcn/ui/blocks components when available
- Extend components properly
- Keep component variants consistent
- Implement proper animations
- Use proper transition utilities
- Keep accessibility in mind

## Responsive Design

- Use mobile-first approach
- Implement proper breakpoints
- Use container queries effectively
- Handle different screen sizes properly
- Implement proper responsive typography
- Use proper responsive spacing

## Performance

- Use proper purge configuration
- Minimize custom CSS
- Use proper caching strategies
- Implement proper code splitting
- Optimize for production
- Monitor bundle size

## Best Practices

- Follow naming conventions
- Keep styles organized
- Use proper documentation
- Implement proper testing
- Follow accessibility guidelines
- Use proper version control

---

description: TypeScript coding standards and best practices for modern web development
globs: **/\*.ts, **/_.tsx, \*\*/_.d.ts

---

# TypeScript Best Practices

## Type System

- Prefer interfaces over types for object definitions
- Use type for unions, intersections, and mapped types
- Avoid using `any`, prefer `unknown` for unknown types
- Use strict TypeScript configuration
- Leverage TypeScript's built-in utility types
- Use generics for reusable type patterns

## Naming Conventions

- Use PascalCase for type names and interfaces
- Use camelCase for variables and functions
- Use UPPER_CASE for constants
- Use descriptive names with auxiliary verbs (e.g., isLoading, hasError)
- Prefix interfaces for React props with 'Props' (e.g., ButtonProps)

## Code Organization

- Keep type definitions close to where they're used
- Export types and interfaces from dedicated type files when shared
- Use barrel exports (index.ts) for organizing exports
- Place shared types in a `types` directory
- Co-locate component props with their components

## Functions

- Use explicit return types for public functions
- Use arrow functions for callbacks and methods
- Implement proper error handling with custom error types
- Use function overloads for complex type scenarios
- Prefer async/await over Promises

## Best Practices

- Enable strict mode in tsconfig.json
- Use readonly for immutable properties
- Leverage discriminated unions for type safety
- Use type guards for runtime type checking
- Implement proper null checking
- Avoid type assertions unless necessary

## Error Handling

- Create custom error types for domain-specific errors
- Use Result types for operations that can fail
- Implement proper error boundaries
- Use try-catch blocks with typed catch clauses
- Handle Promise rejections properly

## Patterns

- Use the Builder pattern for complex object creation
- Implement the Repository pattern for data access
- Use the Factory pattern for object creation
- Leverage dependency injection
- Use the Module pattern for encapsulation

---

description: Next.js form component standards and best practices using shadcn/ui
globs: **/components/**/_.tsx, **/app/**/_.tsx, **/pages/**/\*.tsx

---

# **Next.js Form Component Best Practices**

## **Form Architecture**

- Wrap forms in shadcn/ui Card components for consistent styling
- use shadcn blocks for form/dashboard/charts structure
- Use CardHeader, CardContent structure for organized layout
- Implement proper form element hierarchy with semantic HTML
- Use grid layouts for responsive form structure
- Separate social login buttons from email/password fields with visual dividers

## **Input Components**

- Use shadcn/ui Input components for all form fields
- Implement proper Label association with htmlFor attributes
- Add placeholder text for better user experience
- Use appropriate input types (email, password, etc.)
- Mark required fields with the required attribute

## **Button Implementation**

- Use shadcn/ui Button component with proper variants
- Implement outline variant for secondary actions (social logins)
- Use full width buttons for primary form actions
- Include proper SVG icons for social login buttons
- Ensure buttons have descriptive text content

## **Layout and Styling**

- Use Tailwind CSS utility classes for spacing and layout
- Implement consistent gap spacing using grid gap utilities
- Use flexbox for button arrangements and alignments
- Apply proper text alignment and sizing classes
- Implement responsive design patterns

## **Social Authentication**

- Include both Apple and Google login options
- Use proper SVG icons with correct viewBox dimensions
- Implement consistent button styling across social providers
- Place social logins prominently above email/password form
- Use semantic button text (e.g., "Login with Apple")

## **Form Validation**

- Add required attributes to necessary input fields
- Use proper input types for automatic validation
- Implement client-side validation patterns
- Provide clear error messaging capabilities
- Use proper form submission handling

## **Accessibility Standards**

- Associate labels with inputs using htmlFor/id relationships
- Use semantic HTML elements (form, button, input)
- Implement proper heading hierarchy in card headers
- Ensure sufficient color contrast for text elements
- Provide descriptive button and link text

## **Visual Hierarchy**

- Use CardTitle for main form headings
- Implement CardDescription for supplementary text
- Create visual separation between form sections
- Use relative positioning for decorative elements
- Apply consistent text sizing and color schemes

## **Navigation Elements**

- Include "Forgot password" links in appropriate locations
- Provide clear sign-up links for new users
- Use proper link styling with hover effects
- Implement underline-offset for better readability
- Position navigation elements logically within the form
- Do not use <a> tags for navigation links, use shadcn/ui/Next Link components instead

## **Best Practices**

- Use semantic HTML5 form elements
- Implement proper TypeScript interfaces for all props
- Leverage shadcn/ui component system consistently
- Apply responsive design principles
- Ensure cross-browser compatibility
- Maintain consistent code formatting and structure
- Use meaningful component and variable names
- Implement proper error handling and loading states

## React Data Fetching

- Never use API calls inside useEffect
- Use TanStack Query for all data fetching
- Use useMutation for all data modifications
- Implement proper error boundaries
- Handle loading states consistently
- Use proper query key patterns

## TanStack Query Standards

- Use consistent query key naming
- Implement proper cache invalidation
- Use proper stale time configurations
- Handle dependent queries correctly
- Implement optimistic updates
- Use proper retry strategies

## API Endpoint Design

- Check for existing endpoints before creating new ones
- Use RESTful naming conventions
- Implement proper HTTP status codes
- Use consistent response formats
- Handle errors uniformly
- Implement proper validation

## API Reuse Strategy

- Search codebase for similar patterns first
- Extend existing endpoints with parameters
- Reuse existing custom hooks
- Follow established naming conventions
- Document endpoint capabilities
- Avoid duplicate functionality

## Authentication Patterns

- Never trigger auth actions in useEffect
- Use explicit user-initiated actions only
- Implement proper session management
- Handle auth errors gracefully
- Use consistent auth state patterns
- Implement proper logout procedures

## Component Architecture

- Separate concerns properly
- Use composition over inheritance
- Implement proper prop typing
- Avoid props drilling
- Use React.memo for expensive components
- Implement proper error boundaries

## State Management

- Avoid duplicating server state locally
- Use TanStack Query as single source of truth
- Minimize global state usage
- Use proper state lifting patterns
- Implement proper form state management
- Handle state updates immutably

- Prices must be in Naira
