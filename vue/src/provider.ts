import { inject, type App } from "vue";
import { OpenAI } from "openai";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

const AI_CLIENT_PROVIDER = Symbol("client");

type AIClientProvider = { client: OpenAI; systemPrompt: string };

export const configureAppWithProviders =
  ({ client, systemPrompt }: AIClientProvider) =>
  (app: App) => {
    const pinia = createPinia();
    pinia.use(piniaPluginPersistedstate);

    app.use(pinia).provide(AI_CLIENT_PROVIDER, {
      client,
      systemPrompt,
    });
  };

export function useAI() {
  return inject<AIClientProvider>(AI_CLIENT_PROVIDER)!;
}
