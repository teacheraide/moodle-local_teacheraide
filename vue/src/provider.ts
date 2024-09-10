import { inject, type App } from "vue";
import { OpenAI } from "openai";

const AI_CLIENT_PROVIDER = Symbol("client");

type AIClientProvider = { client: OpenAI; systemPrompt: string };

export const configureAppWithProviders =
  ({ client, systemPrompt }: AIClientProvider) =>
  (app: App) => {
    app.provide(AI_CLIENT_PROVIDER, {
      client,
      systemPrompt,
    });
  };

export function useAI() {
  return inject<AIClientProvider>(AI_CLIENT_PROVIDER)!;
}
