import * as vscode from 'vscode';

export async function grabContext(msg: any, ctx: vscode.ExtensionContext) {
  const selection = await grabSelection();
  const snippets: any[] = [];
  const maxKB = vscode.workspace.getConfiguration().get<number>('router.addSelectionMaxKB', 128);

  const push = (source: string, path?: string, text?: string) => {
    if (!text) return;
    const bytes = Buffer.byteLength(text, 'utf8');
    let t = text; let truncated = false;
    const limit = maxKB * 1024;
    if (bytes > limit) {
      const head = t.slice(0, Math.floor(limit/2));
      const tail = t.slice(-Math.floor(limit/2));
      t = head + '\n…\n' + tail;
      truncated = true;
    }
    snippets.push({ source, path, text: t, truncated, bytes });
  };

  if (msg.chips?.includes('selection') && selection?.text) push('selection', selection.path, selection.text);

  if (msg.chips?.includes('file')) {
    const doc = vscode.window.activeTextEditor?.document;
    if (doc) push('file', doc.uri.fsPath, doc.getText());
  }
  if (msg.chips?.includes('open_editors')) {
    vscode.window.visibleTextEditors.forEach(ed => push('open_editors', ed.document.uri.fsPath, ed.document.getText()));
  }
  if (msg.chips?.includes('clipboard')) {
    try { push('clipboard', undefined, await vscode.env.clipboard.readText()); } catch {}
  }

  const language = vscode.window.activeTextEditor?.document?.languageId;
  const file_path = vscode.window.activeTextEditor?.document?.uri.fsPath;

  return {
    prompt: String(msg.prompt || ''),
    context: {
      language, file_path,
      selection_bytes: selection?.bytes ?? 0,
      snippets
    },
    meta: { ui: 'sidebar' }
  };
}

async function grabSelection() {
  const ed = vscode.window.activeTextEditor;
  if (!ed) return undefined;
  const sel = ed.selection;
  if (sel.isEmpty) return undefined;
  const text = ed.document.getText(sel);
  return { text, path: ed.document.uri.fsPath, bytes: Buffer.byteLength(text, 'utf8') };
}
