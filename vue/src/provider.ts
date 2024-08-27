import { inject, type App } from "vue";
import { Ollama } from "ollama/browser";

const AI_CLIENT_PROVIDER = Symbol("client");

type AIClientProvider = { model: string; ollama: Ollama };

export const configureAppWithProviders =
  ({ model, ollama }: AIClientProvider) =>
  (app: App) => {
    app.provide(AI_CLIENT_PROVIDER, {
      model,
      ollama,
    });
  };

export function useAI() {
  return inject<AIClientProvider>(AI_CLIENT_PROVIDER)!;
}
