# LLM Router Client

VS Code extension that connects to your **llm-router-go** backend to recommend the best model.

## Cost-free path (Sidebar)
1. Run `npm i && npm run compile` then press **F5** to launch the Extension Development Host.
2. Open the **Router** view from the Activity Bar.
3. Type a prompt and optionally add selection, file, open editors, or clipboard.
4. Click **Send**. The response shows `recommended_model`, `rationale`, and `alternatives`.
5. Use the buttons to copy the prompt or recommended model.

## Copilot integration (flagged)
1. Enable the `router.enableCopilotParticipant` setting.
2. ⚠️ Using `@router` in Copilot Chat **consumes Copilot requests**.
3. In Copilot Chat, type `@router Recommend model for this file`.
4. The `Router: Open Copilot Chat` command copies a prompt and opens Chat for manual paste.

## Configuration

| Key | Default | Description |
| --- | --- | --- |
| `router.apiBase` | `http://localhost:8080` | Base URL for llm-router-go |
| `router.apiKey` | `` | API key sent as `X-API-Key` |
| `router.addSelectionMaxKB` | `128` | Max KB to include per selection/file |
| `router.confidenceThreshold` | `0.55` | Min confidence to show inline hints |
| `router.showInlineHints` | `true` | Show diagnostics/CodeLens/StatusBar suggestions |
| `router.enableCopilotParticipant` | `false` | Enable @router in Copilot Chat (uses Copilot) |

## Manual test steps

1. Run `llm-router-go` with `/v1/recommend` endpoint.
2. In this repo: `npm i && npm run compile` → F5.
3. Sidebar → enter prompt, add selection, send.
4. Verify response shows `recommended_model`, `rationale`, `alternatives`.
5. Toggle `router.showInlineHints` → CodeLens + StatusBar appear/disappear.
6. (Optional) Enable participant flag, open Copilot Chat → type `@router Recommend model for this file`. Observe billing notice.
