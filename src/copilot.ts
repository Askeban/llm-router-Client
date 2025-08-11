import * as vscode from "vscode";

/**
 * Best-effort: try to set various known Copilot/Cursor model settings.
 * Returns true if any setting was updated without throwing.
 */
export async function trySetCopilotModel(modelId: string): Promise<boolean> {
  const cfg = vscode.workspace.getConfiguration();
  const auto = cfg.get<boolean>("llmRouter.enableAutoSwitchCopilot", true);

  // Candidate sections/keys (these vary by build/channel)
  const candidates: Array<[section: string, key: string]> = [
    ["github.copilot", "model"],
    ["github.copilot.chat", "model"],
    ["copilot", "model"],
    ["cursor", "model"],
  ];

  let updated = false;
  for (const [section, key] of candidates) {
    const sectionCfg = vscode.workspace.getConfiguration(section);
    try {
      const current = sectionCfg.get<string>(key);
      if (auto || current !== undefined) {
        await sectionCfg.update(key, modelId, vscode.ConfigurationTarget.Global);
        updated = true;
      }
    } catch {
      // ignore; move to next candidate
    }
  }
  return updated;
}

