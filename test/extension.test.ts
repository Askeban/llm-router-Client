import * as assert from 'assert';
import * as vscode from 'vscode';

declare const suite: any;
declare const test: any;

suite('Router basics', () => {
  test('commands register', async () => {
    const cmds = await vscode.commands.getCommands(true);
    assert.ok(cmds.includes('routerChat.open'));
    assert.ok(cmds.includes('router.handoffToCopilot'));
  });
});
