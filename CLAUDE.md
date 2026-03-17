# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style

- Use comments sparingly — only comment complex or non-obvious code.

## Commands

```bash
# Setup (first time)
npm run setup          # install deps + prisma generate + prisma migrate dev

# Development
npm run dev            # Next.js dev server with Turbopack at http://localhost:3000

# Build & production
npm run build
npm run start

# Testing
npm run test           # vitest (watch mode)

# Linting
npm run lint

# Database
npm run db:reset       # reset and re-migrate SQLite database
npx prisma studio      # browse database
```

## Environment Variables

- `ANTHROPIC_API_KEY` — optional; if absent, the app falls back to a mock AI provider (`src/lib/provider.ts`)
- `JWT_SECRET` — defaults to `"development-secret-key"` in dev

## Architecture

UIGen is a Next.js 15 app where users describe React components in a chat interface and an AI (Claude) generates and edits files in a **virtual file system** (in-memory, nothing written to disk). A sandboxed iframe previews the result in real time.

### Request flow

1. User types in **ChatInterface** → calls `/api/chat` (streaming)
2. `/api/chat/route.ts` streams Claude responses with two AI tools:
   - `str_replace_editor` (`src/lib/tools/str-replace.ts`) — creates/edits files
   - `file_manager` (`src/lib/tools/file-manager.ts`) — renames/deletes files
3. Tool calls mutate **VirtualFileSystem** via `FileSystemContext`
4. **PreviewFrame** watches `FileSystemContext`, transforms JSX with Babel standalone, builds an import map using `esm.sh` CDN, and renders into a sandboxed iframe

### State management

Two React context providers wrap the app (defined in `src/lib/contexts/`):

| Provider             | Manages                                                     |
| -------------------- | ----------------------------------------------------------- |
| `ChatProvider`       | AI messages, streaming state (Vercel AI SDK `useChat`)      |
| `FileSystemProvider` | VirtualFileSystem instance, selected file, refresh triggers |

### Key files

| Path                                   | Purpose                                                    |
| -------------------------------------- | ---------------------------------------------------------- |
| `src/app/api/chat/route.ts`            | AI streaming endpoint — tool definitions live here         |
| `src/lib/file-system.ts`               | VirtualFileSystem class — all file operations              |
| `src/lib/transform/jsx-transformer.ts` | Babel JSX transform + import map + preview HTML generation |
| `src/lib/provider.ts`                  | Wraps Anthropic SDK; falls back to mock when no API key    |
| `src/lib/prompts/generation.tsx`       | System prompt sent to Claude                               |
| `src/lib/auth.ts`                      | JWT session management (JOSE + bcrypt)                     |
| `prisma/schema.prisma`                 | SQLite schema: User, Project                               |
| `src/actions/`                         | Next.js server actions for auth and project CRUD           |

### Virtual file system & preview

- Every generated component must have `/App.jsx` as its entry point (default export)
- Non-library imports use the `@/` alias (e.g., `import Foo from '@/components/Foo'`)
- The JSX transformer resolves `@/` paths against the virtual FS and rewrites bare npm specifiers to `esm.sh` URLs
- Styling is always Tailwind CSS — no inline styles, no plain CSS files

### Database

SQLite via Prisma. Dev database: `prisma/dev.db`. Schema has two models: `User` and `Project` (stores serialised file system + chat messages). Anonymous users can work without an account; `src/lib/anon-work-tracker.ts` tracks their progress until sign-up.

### Testing

Tests live alongside source in `__tests__/` subdirectories. Uses Vitest + jsdom + React Testing Library. Run a single test file:

```bash
npx vitest src/components/chat/__tests__/ChatInterface.test.tsx
```
