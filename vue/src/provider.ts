import { inject, type App } from "vue";
import { OpenAI } from "openai";
import { Ollama } from "ollama/browser";

const CLIENTS_PROVIDER = Symbol("clients");

type OpenAIProvider = { openai: OpenAI; model: string; ollama: Ollama };

export const configureAppWithProviders =
  ({ openai, model, ollama }: OpenAIProvider) =>
  (app: App) => {
    app.provide(CLIENTS_PROVIDER, {
      openai,
      model,
      ollama,
    });
  };

export function useClients() {
  return inject<OpenAIProvider>(CLIENTS_PROVIDER)!;
}
