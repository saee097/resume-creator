export interface AIProvider {
  readonly name: string;
  complete(prompt: string): Promise<string>;
}

export interface AITextOptions {
  temperature?: number;
  maxTokens?: number;
}

export const aiTextOptions: AITextOptions = { temperature: 0.7, maxTokens: 800 };
