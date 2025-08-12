import * as vscode from 'vscode';
import { fetch } from 'undici';

export async function recommend(payload: any): Promise<any> {
  const cfg = vscode.workspace.getConfiguration();
  const base = cfg.get<string>('router.apiBase')!;
  const key = cfg.get<string>('router.apiKey') || '';
  const url = `${base.replace(/\/$/, '')}/v1/recommend`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(key ? { 'X-API-Key': key } : {}) },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const txt = await res.text().catch(()=>String(res.status));
    throw new Error(`Router error ${res.status}: ${txt}`);
  }
  return await res.json() as any;
}
