# MCP Usage

Phase 6 adds `@podoui/mcp`, a Model Context Protocol stdio server for Podo v2 specs.

## Start

Requires Node.js 22+ and npm. No global install is needed:

```sh
npx -y podo-ui mcp
```

The server uses stdio, not HTTP. A silent terminal is normal: it is waiting for MCP messages. Ctrl+C stops a manually started server. AI clients launch their own process after registration; do not keep another terminal running. Initial execution downloads the package from npm.

Register once, replacing the absolute project path, then restart the client:

```sh
claude mcp add podo -- npx -y podo-ui mcp --root "/absolute/path/to/project"
codex mcp add podo -- npx -y podo-ui mcp --root "/absolute/path/to/project"
```

Claude Code defaults to local project scope; Codex uses user configuration. Use distinct names/roots for multiple projects. See [Codex MCP configuration](https://developers.openai.com/codex/mcp/).

For clients accepting `mcpServers` JSON, merge this entry into their MCP configuration:

```json
{
  "mcpServers": {
    "podo": {
      "command": "npx",
      "args": ["-y", "podo-ui", "mcp", "--root", "/absolute/path/to/project"]
    }
  }
}
```

On Windows, clients that cannot launch npx directly can use `"command": "cmd"` with args beginning `["/c", "npx", ...]`.

Without `--root`, the CLI locates the project from its working directory. Projects without `.podo` use bundled defaults. Existing local specs are read on each tool call. Installed users can also run `podo mcp` or `podo-mcp` from their project directory.

Check path selection without starting a server:

```sh
npx -y podo-ui mcp --root "/absolute/path/to/project" --dry-run
```

This is a launch preview, not a protocol or validation check. Verify connection by finding `get_system_overview` in the client and calling it. Use `validate_podo_project` for spec errors. For first-run timeouts, run the preview above to download the package, then reconnect.

## Read Tools

- `get_system_overview`: version, schema, targets, themes, components, icons, validation count.
- `search_tokens`: search by token path, type, value, or references.
- `get_token`: raw value, resolved value, references, origin metadata.
- `search_components`: search by name, category, prop, slot, or target.
- `get_component_spec`: complete component JSON spec.
- `get_component_example`: target-specific usage examples.
- `validate_podo_project`: validate `.podo` config, tokens, themes, components, and icons.
- `explain_migration`: explain lock schema mismatch and migration state.

## Suggest Tool

- `suggest_component_spec`: returns a draft component spec and never writes files.

## Prompt Examples

```text
Use Podo MCP to find the Button component spec and generate a React usage example with the correct import.
```

```text
Search Podo tokens for dashboard typography and explain which token controls h1 size.
```

```text
Suggest a local component spec for a gnb with brand, primary navigation, and actions slots. Do not write files.
```

## Claude Code Examples

Review a local token change:

```text
Use the Podo MCP server. Run validate_podo_project, then explain any token alias or component token binding issues. Do not edit files.
```

Generate a component draft:

```text
Use suggest_component_spec to draft a command menu component with trigger, content, item, and empty slots. Return JSON only and do not write files.
```

Explain an update:

```text
Use explain_migration for the current project and summarize whether podo update --dry-run is safe to apply.
```

## Codex Examples

Implementation-oriented prompt:

```text
Use Podo MCP to inspect get_component_spec for Button and Field, then update the local React screen to use their supported props only. Run podo validate after changes.
```

Token lookup prompt:

```text
Search tokens for dashboard typography and color-scheme-specific text colors. Use get_token for each match before editing CSS.
```

Migration prompt:

```text
Run validate_podo_project and explain_migration. If conflicts exist, prepare a dry-run-only migration report under .podo/reports without modifying token or component specs.
```

## Write Safety

The current MCP surface is read-first. `suggest_component_spec` returns a draft and does not write. Any future write tool must support validation and dry-run output before it writes under `.podo`.
