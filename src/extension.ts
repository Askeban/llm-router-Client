import * as vscode from 'vscode';
import { SidebarProvider } from './chat/SidebarProvider';
import { registerHints } from './hints/register';
import { handoffToCopilot } from './copilot/handoff';
import { registerCopilotParticipant } from './copilot/participant';

export function activate(context: vscode.ExtensionContext) {
  const sidebar = new SidebarProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('routerChat.view', sidebar, { webviewOptions: { retainContextWhenHidden: true } }),
    vscode.commands.registerCommand('routerChat.open', () => sidebar.reveal()),
    vscode.commands.registerCommand('routerChat.reset', () => sidebar.reset()),
    vscode.commands.registerCommand('routerChat.send', () => sidebar.sendViaCommand()),
    vscode.commands.registerCommand('router.handoffToCopilot', () => handoffToCopilot())
  );

  // Inline hints (can be toggled off)
  registerHints(context);
  registerCopilotParticipant(context);
}

export function deactivate() {}
