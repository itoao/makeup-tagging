# Project Rules

This guide outlines the best practices, conventions, and standards for development using modern web technologies.

**Always adhere to these guidelines**


## Development Philosophy

- Write clean, maintainable, and scalable code
- Follow the principles of SOLID
- Prioritize functional and declarative programming patterns over imperative ones
- Emphasize type safety and static analysis
- Practice component-driven development

## Code Implementation Guidelines
### Code Style

- Eliminate unused variables
- Always handle error parameters in callbacks

### Naming Conventions

- Use PascalCase for:
  - Components
  - Type definitions
  - Interfaces
- Use kebab-case for:
  - Directory names (e.g., components/auth-wizard)
  - File names (e.g., user-profile.tsx)
- Use camelCase for:
  - Variables
  - Functions
  - Methods
  - Hooks
  - Properties
  - Props
- Use uppercase for:
  - Environment variables
  - Constants
  - Global settings
- Prefix boolean variables with a verb: isLoading, hasError, canSubmit
- Except for the following, use complete words instead of abbreviations:
  - err (error)
  - req (request)
  - res (response)
  - props (properties)
  - ref (reference)

### TypeScript Implementation

- Enable strict mode
- Follow verbatimModuleSyntax
- Use type guards to safely handle potential undefined or null values
- Use generics appropriately
- Use the unknown type appropriately
- Leverage TypeScript utility types (Partial, Pick, Omit) for cleaner and more reusable code
- Use mapped types to dynamically create variants of existing types
- Do not use TypeScript-specific syntaxes such as enum

### ES Modules

- When importing Node.js APIs, use the node: prefix (e.g., "node:fs")

### Data Modeling
- Create migration files as needed
- Create supabase/seed.ts simultaneously (ask users to `run npm run seed`)

## Documentation
- Write TSDoc appropriately in Japanese
- Document all public functions, classes, methods, and interfaces
- Leave appropriate comments in Japanese
- Add examples where applicable
- Use complete sentences with appropriate punctuation
- Keep explanations clear and concise
- Use proper Markdown formatting
- Use appropriate code blocks
- Use proper links
- Use appropriate headings
- Use appropriate lists
