import * as vscode from 'vscode';
import { recommend } from '../core/api';

export function registerHints(context: vscode.ExtensionContext) {
  const cfg = () => vscode.workspace.getConfiguration();
  if (!cfg().get<boolean>('router.showInlineHints', true)) return;

  const diags = vscode.languages.createDiagnosticCollection('llm-router');
  context.subscriptions.push(diags);

  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  status.command = 'routerChat.open';
  context.subscriptions.push(status);

  const codelensProvider: vscode.CodeLensProvider = {
    provideCodeLenses(doc) {
      const range = new vscode.Range(0,0,0,0);
      const lens = new vscode.CodeLens(range, { title: 'Router suggests: (analyzing...)', command: '' });
      (async () => {
        const suggestion = await localHeuristic(doc);
        let title = `Router suggests: ${suggestion.model}`;
        if (suggestion.needsServer) {
          try {
            const res = await recommend({ prompt: 'recommend for file', context: { language: doc.languageId, file_path: doc.uri.fsPath, selection_bytes: doc.getText().length } });
            title = `Router suggests: ${res.recommended_model}`;
            status.text = `$(sparkle) Router: ${res.recommended_model}`;
            status.show();
          } catch {
            title = `Router suggests: ${suggestion.model} (offline)`;
          }
        } else {
          status.text = `$(sparkle) Router: ${suggestion.model}`; status.show();
        }
        lens.command = { title, command: 'routerChat.open' };
      })();
      return [lens];
    }
  };

  context.subscriptions.push(vscode.languages.registerCodeLensProvider({ scheme:'file' }, codelensProvider));

  vscode.window.onDidChangeActiveTextEditor(() => {
    status.hide();
  }, null, context.subscriptions);

  function localHeuristic(doc: vscode.TextDocument) {
    const text = doc.getText();
    const isProse = /[A-Za-z]{5,}\s+[A-Za-z]{5,}/.test(text.slice(0, 500));
    const isLarge = text.length > 50000;
    const model = isLarge ? 'claude-3.5-sonnet' : isProse ? 'gpt-4o' : 'gpt-4o-mini';
    const threshold = vscode.workspace.getConfiguration().get<number>('router.confidenceThreshold', 0.55);
    const confidence = isLarge ? 0.7 : 0.6;
    return { model, confidence, needsServer: confidence < threshold };
  }
}
