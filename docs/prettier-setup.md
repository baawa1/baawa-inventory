# Prettier Setup for Tailwind CSS

This project uses Prettier with the `prettier-plugin-tailwindcss` plugin to automatically format and sort Tailwind CSS classes.

## Installation

The following packages are installed as dev dependencies:

- `prettier`: The core Prettier formatter
- `prettier-plugin-tailwindcss`: Plugin for Tailwind CSS class sorting

## Configuration

### `.prettierrc`

The Prettier configuration includes:

- **Tailwind CSS plugin**: Automatically sorts Tailwind classes
- **Tailwind functions**: Recognizes `clsx`, `cn`, and `twMerge` functions
- **Code style**: Single quotes, 2-space indentation, 80-character line width
- **File-specific overrides**: Different settings for TypeScript and JSON files

### `.prettierignore`

Excludes files that shouldn't be formatted:
- Build outputs (`.next/`, `dist/`, etc.)
- Dependencies (`node_modules/`)
- Generated files (`.d.ts`, migrations)
- Configuration files
- Test results and reports

## Usage

### Command Line

```bash
# Format all files
npm run format

# Check formatting without making changes
npm run format:check

# Format and fix ESLint issues
npm run format:fix
```

### VS Code Integration

The project includes VS Code settings that:

- Set Prettier as the default formatter
- Enable format on save
- Enable format on paste
- Configure ESLint to run on save

## Tailwind CSS Class Sorting

The `prettier-plugin-tailwindcss` plugin automatically sorts Tailwind CSS classes in a consistent order:

1. Layout (position, display, etc.)
2. Spacing (margin, padding)
3. Sizing (width, height)
4. Typography (text, font)
5. Backgrounds
6. Borders
7. Effects (shadows, opacity)
8. Transitions
9. Transforms
10. Interactivity

### Example

Before formatting:
```tsx
<div className="text-red-500 bg-blue-200 p-4 flex items-center justify-center">
```

After formatting:
```tsx
<div className="flex items-center justify-center bg-blue-200 p-4 text-red-500">
```

## Custom Tailwind Functions

The configuration recognizes these Tailwind utility functions:
- `clsx`: For conditional class names
- `cn`: Custom utility function (from `@/lib/utils`)
- `twMerge`: For merging Tailwind classes

## Best Practices

1. **Always run format before committing**: Use `npm run format` to ensure consistent formatting
2. **Use VS Code Prettier extension**: Install the Prettier extension for automatic formatting
3. **Check formatting in CI**: Use `npm run format:check` in your CI pipeline
4. **Keep classes organized**: Let Prettier handle the sorting, focus on the logic

## Troubleshooting

### Prettier not formatting Tailwind classes

1. Ensure the `prettier-plugin-tailwindcss` plugin is installed
2. Check that the plugin is listed in `.prettierrc`
3. Verify that your Tailwind config is properly set up

### VS Code not formatting on save

1. Install the Prettier extension
2. Ensure the workspace settings are applied
3. Check that Prettier is set as the default formatter

### Conflicts with ESLint

The project is configured to run both Prettier and ESLint:
- Prettier handles formatting
- ESLint handles code quality and rules
- Use `npm run format:fix` to run both tools 