import { inject, type App } from "vue";
import { OpenAI } from "openai";

const AI_CLIENT_PROVIDER = Symbol("client");

type AIClientProvider = { model: string; client: OpenAI };

export const configureAppWithProviders =
  ({ model, client }: AIClientProvider) =>
  (app: App) => {
    app.provide(AI_CLIENT_PROVIDER, {
      model,
      client,
    });
  };

export function useAI() {
  return inject<AIClientProvider>(AI_CLIENT_PROVIDER)!;
}
