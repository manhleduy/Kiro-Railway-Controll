# AGENTS.md

This file provides system context, execution rules, and development guidelines for AI coding agents working in this repository.

## 🛠️ Development Environment Commands
When you need to run commands, use these exact setups:
- **Install Dependencies:** `npm install` (never use pnpm or yarn)
- **Start Local Server:** `npm run dev`
- **TypeScript Verification:** `npm run typecheck`
- **Linter & Formatting:** `npm run lint`

## 🧪 Testing Guidelines
Always verify changes before declaring a task complete:
- **Run Unit Tests:** `npm run test`
- **Run Specific Test File:** `npm run test -- [path/to/file.test.ts]`
- **Pre-commit Rule:** You MUST run `npm run typecheck` and `npm run lint` successfully before prompting the user to commit. Do not suggest committing if either command fails.

## 📐 Code Style & Conventions
- **TypeScript:** Strict mode is enabled. Absolutely no `any` types. If a type is complex, write an explicit interface.
- **Styling:** Use Tailwind CSS utility classes. Do not create raw `.css` or `.scss` modules.
- **Async Code:** Prefer `async/await` syntax over raw `.then()` chains.
- **Imports:** Always use absolute path aliases (e.g., `import X from '@/components/ui/X'`) instead of relative steps (e.g., `../../components/ui/X`).

## 🚫 Critical Constraints (Do Not Do)
- **No Package Auto-Installs:** You are forbidden from running package installations. If you require a new dependency, ask the user to install it.
- **No Placeholder Comments:** Never leave `// TODO` or `// ... rest of code goes here ...` in modified files. Ensure all written files are structurally whole.
- **No Direct Schema Migration:** Do not modify database configurations or run SQL queries directly without generating a proper database migration first.