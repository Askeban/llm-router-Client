import * as vscode from 'vscode';
import { recommend } from '../core/api';
import { grabContext } from '../core/context';

export class SidebarProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  constructor(private ctx: vscode.ExtensionContext) {}

  resolveWebviewView(view: vscode.WebviewView) {
    this._view = view;
    view.webview.options = { enableScripts: true };
    view.webview.html = this.getHtml();
    view.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === 'send') {
        const payload = await grabContext(msg, this.ctx);
        try {
          const res = await recommend(payload);
          view.webview.postMessage({ type: 'result', ok: true, res });
        } catch (e: any) {
          view.webview.postMessage({ type: 'result', ok: false, error: e?.message ?? String(e) });
        }
      }
    });
  }

  reveal() { this._view?.show?.(true); }
  reset() { this._view?.webview.postMessage({ type: 'reset' }); }
  sendViaCommand() { this._view?.webview.postMessage({ type: 'sendFromCommand' }); }

  private getHtml() {
    const nonce = String(Math.random());
    const csp = `default-src 'none'; img-src vscode-resource: https: data:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`;
    return `
<!DOCTYPE html><html><head><meta http-equiv="Content-Security-Policy" content="${csp}"/>
<style>
  body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); }
  .row{display:flex;gap:.5rem;align-items:center;margin:.5rem 0}
  .chips{display:flex;gap:.25rem;flex-wrap:wrap;margin:.25rem 0}
  .chip{background:var(--vscode-editorInlayHint-background);padding:.2rem .4rem;border-radius:6px}
  .out{border:1px solid var(--vscode-panel-border);border-radius:8px;padding:.75rem;margin-top:.75rem}
  button{padding:.4rem .6rem;border-radius:6px;border:1px solid var(--vscode-button-border);background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground)}
  #notice{font-size:.85em;opacity:.8;margin-bottom:.5rem}
</style></head><body>
  <div id="notice">This chat calls your <b>llm-router-go</b> backend. <b>No Copilot usage.</b></div>
  <div class="row">
    <textarea id="prompt" rows="4" style="width:100%" placeholder="Ask the router..."></textarea>
  </div>
  <div class="row">
    <button id="addSelection">Add Selection</button>
    <button id="addFile">Add File</button>
    <button id="addOpen">Add Open Editors</button>
    <button id="addClipboard">Add Clipboard</button>
    <label><input type="checkbox" id="includeFile" checked> Include current file</label>
  </div>
  <div class="chips" id="chips"></div>
  <div class="row">
    <button id="send">Send</button>
  </div>
  <div class="out" id="out"></div>
<script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  const chips = [];
  function addChip(c){ chips.push(c); renderChips(); }
  function renderChips(){
    const host = document.getElementById('chips'); host.innerHTML='';
    chips.forEach((c,i)=>{ const el=document.createElement('span'); el.className='chip'; el.textContent=c; el.onclick=()=>{chips.splice(i,1);renderChips();}; host.appendChild(el); });
  }
  document.getElementById('addSelection').onclick=()=>addChip('selection');
  document.getElementById('addFile').onclick=()=>addChip('file');
  document.getElementById('addOpen').onclick=()=>addChip('open_editors');
  document.getElementById('addClipboard').onclick=()=>addChip('clipboard');

  document.getElementById('send').onclick=()=>send();
  window.addEventListener('message', e=>{
    const m=e.data;
    if(m.type==='reset'){ document.getElementById('prompt').value=''; document.getElementById('out').innerHTML=''; return; }
    if(m.type==='sendFromCommand'){ send(); return; }
    if(m.type==='result'){
      const out=document.getElementById('out');
      if(m.ok){
        const r=m.res;
        out.innerHTML = \`
          <div><b>Recommended Model:</b> \${r.recommended_model}</div>
          <div><b>Confidence:</b> \${(r.confidence??0).toFixed(2)}</div>
          <div style="margin:.5rem 0"><b>Why:</b><br/>\${(r.rationale||'').replace(/</g,'&lt;')}</div>
          <div><b>Alternatives:</b> \${(r.alternatives||[]).join(', ')}</div>
          <div class="row" style="margin-top:.5rem">
            <button id="copyPrompt">Copy Prompt</button>
            <button id="copyReco">Copy Recommendation</button>
          </div>\`;
        document.getElementById('copyPrompt').onclick=async()=>{ await navigator.clipboard.writeText(document.getElementById('prompt').value); };
        document.getElementById('copyReco').onclick=async()=>{ await navigator.clipboard.writeText(r.recommended_model); };
      } else {
        out.innerHTML = '<span style="color: var(--vscode-errorForeground)">' + m.error + '</span>';
      }
    }
  });
  function send(){
    const prompt=document.getElementById('prompt').value;
    const includeFile=document.getElementById('includeFile').checked;
    vscode.postMessage({type:'send', prompt, chips, includeFile});
  }
</script>
</body></html>`;
  }
}
