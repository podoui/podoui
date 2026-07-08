# Second MVP Readiness

This document maps the second MVP completion checklist to repository evidence.

| Checklist item                         | Evidence                                                                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React Native basic components          | `packages/native/src/index.test.tsx` renders Button, Input, Field, and Icon through injected React Native hosts and verifies theme context/token style propagation. |
| `podo update --dry-run` migration flow | `packages/cli/src/index.test.ts` writes a migration report, plans updates, applies migration, and updates `.podo/lock.json`; guides document conflict handling.     |
| Claude Code/Codex MCP usage            | `docs/mcp-usage.md`, `docs/mcp-security.md`, and `AGENTS.md` document MCP registration, safe read tools, and Claude/Codex usage prompts.                            |

Required local checks:

```sh
pnpm check
pnpm build
```
