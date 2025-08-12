import * as vscode from 'vscode';
import { recommend } from '../core/api';

export function registerCopilotParticipant(context: vscode.ExtensionContext) {
  const enable = vscode.workspace.getConfiguration().get<boolean>('router.enableCopilotParticipant', false);
  if (!enable) return;

  const chatApi = (vscode as any).chat;
  if (!chatApi?.createChatParticipant) {
    console.warn('Chat API not available; @router disabled.');
    return;
  }

  const part = chatApi.createChatParticipant('router', async (req: any, ctx2: any) => {
    const uiWarn = '**Note:** This interaction uses a **Copilot request**. For cost-free routing, use the **Router Sidebar**.';
    try {
      const text = req.prompt ?? req.text ?? '';
      const lang = vscode.window.activeTextEditor?.document?.languageId;
      const file = vscode.window.activeTextEditor?.document?.uri.fsPath;
      const res = await recommend({ prompt: text, context: { language: lang, file_path: file }, meta: { ui: 'copilot' } });
      const md = [
        uiWarn,
        '',
        `**Recommended Model:** \`${res.recommended_model}\``,
        `**Confidence:** ${(res.confidence ?? 0).toFixed(2)}`,
        '',
        `**Why:**`,
        res.rationale || '_n/a_',
        '',
        res.alternatives?.length ? `**Alternatives:** ${res.alternatives.join(', ')}` : ''
      ].join('\n');
      return { markdown: md };
    } catch (e: any) {
      return { markdown: `${uiWarn}\n\n_Error calling router:_ ${e?.message ?? String(e)}` };
    }
  });

  context.subscriptions.push({ dispose: () => part?.dispose?.() });
}
