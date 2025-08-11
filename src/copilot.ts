import * as vscode from "vscode";

export function gatherPromptAndContext(): {
  prompt: string | undefined;
  language: string | undefined;
  files: { path: string; content: string }[] | undefined;
} {
  const editor = vscode.window.activeTextEditor;
  const cfg = vscode.workspace.getConfiguration();
  const includeContent = cfg.get<boolean>("llmRouter.collectOpenFileContext", true);
  const maxChars = cfg.get<number>("llmRouter.maxContextChars", 4000);

  // Prompt: selection if any; otherwise ask user.
  let prompt: string | undefined =
    editor?.selection && !editor.selection.isEmpty
      ? editor.document.getText(editor.selection)
      : undefined;

  const language = editor?.document?.languageId;

  let files: { path: string; content: string }[] | undefined;
  if (includeContent && editor) {
    const content = editor.document.getText().slice(0, maxChars);
    files = [{ path: editor.document.uri.fsPath, content }];
  }

  return { prompt, language, files };
}

