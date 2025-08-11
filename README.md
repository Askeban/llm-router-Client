# LLM Router — Model Recommender (VSCode)

This extension calls your **llm-router-go** backend to recommend the best model for a given prompt. It can optionally attempt to set **Copilot’s active model** automatically.

## Setup

1. Run your router:
export ROUTER_CONFIG=configs/models.yaml
go run ./cmd/router

→ listening on http://localhost:8080

2. In this folder:
npm install
npm run compile

Press F5 in VSCode to launch Extension Development Host

3. Configure (File → Preferences → Settings → “LLM Router”):
- `llmRouter.apiBase`: `http://localhost:8080`
- `llmRouter.prioritize`: `quality` | `cost` | `latency`
- Toggle context collection if you prefer.

## Use

- Select code or text, press `Ctrl/Cmd+Shift+P` → **LLM Router: Recommend Model**.
- The extension shows a recommendation and lets you:
- **Set Copilot model (best effort)**
- Copy model id
- Open settings

> Note: VSCode/Copilot may change settings keys over time. The extension tries common keys but will gracefully fall back if it can’t write them.

## Privacy

The extension sends your prompt (and optionally active editor content, truncated) to the router you configure (default: localhost). No third-party calls are made by this extension.
How to run it
In a new folder vscode-llm-router, paste these files.

npm install → npm run compile.

Press F5 in VSCode to start the Extension Development Host.

Make sure your router is running on http://localhost:8080.

Select some code/text → run “LLM Router: Recommend Model”.

Try the Set Copilot model option — if Copilot exposes a writable model setting in your build, it’ll switch; otherwise you’ll get a gentle heads-up to set it manually.

- **LLM Router: Route & Open Copilot Chat** → routes, switches model (best effort), and opens Copilot Chat pre-filled with your prompt (clipboard fallback if necessary).

