import * as vscode from "vscode";
import { RouterSelectRequest, RouterSelectResponse } from "./types";

export async function selectModel(req: RouterSelectRequest): Promise<RouterSelectResponse> {
  const cfg = vscode.workspace.getConfiguration();
  const base = cfg.get<string>("llmRouter.apiBase", "http://localhost:8080");
  const timeoutMs = cfg.get<number>("llmRouter.timeoutMs", 5000);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(`${base}/v1/select-model`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      throw new Error(`Router responded ${res.status}: ${await res.text()}`);
    }
    return (await res.json()) as RouterSelectResponse;
  } finally {
    clearTimeout(timer);
  }
}

