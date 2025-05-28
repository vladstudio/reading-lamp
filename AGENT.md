# AGENT.md - Development Guide for Reading Lamp

## Commands
- **Start/Run**: `node reading-lamp.js` or `npm start`
- **Test**: No tests configured (`npm test` returns error)
- **Dependencies**: `npm install`
- **Build**: No build step needed (Node.js ES modules)

## Code Style Guidelines
- **Module Type**: ES modules (`"type": "module"` in package.json)
- **Imports**: Use `import` syntax, prefer named imports
- **File Extensions**: Use `.js` for JavaScript files
- **Naming**: camelCase for variables/functions, UPPER_CASE for constants
- **String Literals**: Use template literals for multi-line/interpolated strings
- **Error Handling**: Use try-catch blocks, throw Error objects with descriptive messages
- **Async/Await**: Prefer async/await over promises
- **CLI**: Uses commander.js for argument parsing, inquirer.js for interactive prompts
- **Console Output**: Use chalk for colored output, ora for spinners
- **Dependencies**: Prefer well-established packages (commander, inquirer, chalk, ora)

## Architecture Notes
- Single main file (`reading-lamp.js`) with clear function separation
- Environment variable support for configuration
- Graceful error handling with user-friendly messages
- Progress indicators for long-running operations
- FFmpeg dependency for audio merging (multi-chunk processing)
