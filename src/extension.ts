import * as vscode from "vscode";
import { selectModel } from "./api";
import { gatherPromptAndContext } from "./context";
import { trySetCopilotModel } from "./copilot";

async function openCopilotChatWithPrompt(prompt: string): Promise<void> {
  // Try several commands across Copilot/VS Code versions
  const candidates: { id: string; args?: any[] }[] = [
    { id: "github.copilot.chat.ask", args: [prompt] },
    { id: "github.copilot.chat.open", args: [prompt] },
    { id: "github.copilot.interactive.open", args: [prompt] },
    { id: "workbench.action.chat.open" } // VS Code Chat view
  ];

  for (const c of candidates) {
    try {
      const ok = await vscode.commands.executeCommand(c.id, ...(c.args ?? []));
      if (ok !== undefined || c.id === "workbench.action.chat.open") return;
    } catch { /* try next */ }
  }

  // Fallback: open any chat view we can, copy prompt to clipboard
  try { await vscode.commands.executeCommand("github.copilot.chat.open"); } catch {}
  try { await vscode.commands.executeCommand("workbench.action.chat.open"); } catch {}
  await vscode.env.clipboard.writeText(prompt);
  vscode.window.showInformationMessage(
    "Your prompt was copied to clipboard. Paste it into Copilot Chat.",
    "OK"
  );
}

export function activate(context: vscode.ExtensionContext) {
  // Status bar entry
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  status.text = "LLM Router: idle";
  status.tooltip = "LLM Router — recommend model";
  status.command = "llmRouter.recommend";
  status.show();

  // Command: Recommend Model
  const recommendCmd = vscode.commands.registerCommand("llmRouter.recommend", async () => {
    const cfg = vscode.workspace.getConfiguration();

    let { prompt, language, files } = gatherPromptAndContext();
    if (!prompt) {
      prompt = await vscode.window.showInputBox({
        prompt: "Enter your prompt for routing",
        placeHolder: "Describe your task…",
        ignoreFocusOut: true
      });
    }
    if (!prompt) return;

    const req = {
      prompt,
      context: { language, files },
      preferences: {
        prioritize: cfg.get<string>("llmRouter.prioritize", "quality"),
        allow_truncation: cfg.get<boolean>("llmRouter.allowTruncation", false)
      }
    };

    status.text = "LLM Router: routing…";
    try {
      const resp = await selectModel(req);
      const model = resp.recommended_model;
      const confidence = Math.round((resp.confidence ?? 0) * 100);
      status.text = `LLM Router: ${model} (${confidence}%)`;

      const action = await vscode.window.showInformationMessage(
        `Recommended: ${resp.model_name} (${model}) • confidence ${confidence}%\n` +
          `Type: ${resp.explanation?.prompt_type} • Complexity: ${resp.explanation?.complexity_score}`,
        "Set Copilot model (best effort)",
        "Copy model id",
        "Open settings"
      );

      if (action === "Copy model id") {
        await vscode.env.clipboard.writeText(model);
        vscode.window.showInformationMessage("Model id copied.");
      } else if (action === "Open settings") {
        await vscode.commands.executeCommand("workbench.action.openSettings", "llmRouter");
      } else if (action === "Set Copilot model (best effort)"){
        const ok = await trySetCopilotModel(model);
        vscode.window.showInformationMessage(
          ok ? `Attempted to set Copilot model to ${model}.`
             : "Tried to set Copilot model, but couldn't find a compatible setting; set it manually in Copilot."
        );
      }
    } catch (err: any) {
      status.text = "LLM Router: error";
      vscode.window.showErrorMessage(`Router error: ${err?.message || err}`);
    }
  });

  // Command: Route & Open Copilot Chat (NEW)
  const routeAndOpenCmd = vscode.commands.registerCommand("llmRouter.routeAndOpenChat", async () => {
    const cfg = vscode.workspace.getConfiguration();

    let { prompt, language, files } = gatherPromptAndContext();
    if (!prompt) {
      prompt = await vscode.window.showInputBox({
        prompt: "Enter your prompt for routing",
        placeHolder: "Describe your task…",
        ignoreFocusOut: true
      });
    }
    if (!prompt) return;

    const req = {
      prompt,
      context: { language, files },
      preferences: {
        prioritize: cfg.get<string>("llmRouter.prioritize", "quality"),
        allow_truncation: cfg.get<boolean>("llmRouter.allowTruncation", false)
      }
    };

    try {
      vscode.window.setStatusBarMessage("LLM Router: routing…", 1500);
      const resp = await selectModel(req);

      // Best-effort switch Copilot model
      try {
        const switched = await trySetCopilotModel(resp.recommended_model);
        if (switched) {
          vscode.window.setStatusBarMessage(`LLM Router: switched → ${resp.recommended_model}`, 2000);
        }
      } catch { /* ignore */ }

      // Open Copilot Chat pre-filled (or clipboard fallback)
      await openCopilotChatWithPrompt(prompt);

      const confidencePct = Math.round((resp.confidence ?? 0) * 100);
      vscode.window.showInformationMessage(
        `Recommended: ${resp.model_name} (${resp.recommended_model}) • confidence ${confidencePct}%`
      );
    } catch (err: any) {
      vscode.window.showErrorMessage(`Router error: ${err?.message || err}`);
    }
  });

  context.subscriptions.push(status, recommendCmd, routeAndOpenCmd);
}

export function deactivate() {}

