import * as vscode from 'vscode';

export async function handoffToCopilot(prompt?: string) {
  const text = prompt ?? (await vscode.window.showInputBox({ prompt: 'Prompt to send to Copilot' })) ?? '';
  if (!text) { return; }
  await vscode.env.clipboard.writeText(text);
  // Open Chat (user must paste)
  await vscode.commands.executeCommand('workbench.action.chat.open');
  vscode.window.showInformationMessage('Prompt copied. Paste it into Copilot Chat. (This uses a Copilot request.)');
}
