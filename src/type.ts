export type RouterSelectRequest = {
  prompt: string;
  context?: {
    language?: string;
    files?: { path: string; content: string }[];
  };
  preferences?: {
    prioritize?: "quality" | "cost" | "latency";
    allow_truncation?: boolean;
  };
};

export type RouterSelectResponse = {
  recommended_model: string;
  confidence: number;
  model_name: string;
  explanation: Record<string, any>;
};

