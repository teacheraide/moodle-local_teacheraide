import { inject, type App } from "vue";
import { AzureOpenAI } from "openai";
import { VueQueryPlugin } from "@tanstack/vue-query";

const OPENAI_PROVIDER = Symbol("openai");

type OpenAIProvider = { openai: AzureOpenAI; model: string };

export const configureAppWithProviders =
  ({ openai, model }: OpenAIProvider) =>
  (app: App) => {
    app.use(VueQueryPlugin).provide(OPENAI_PROVIDER, {
      openai,
      model,
    });
  };

export function useOpenAI() {
  return inject<OpenAIProvider>(OPENAI_PROVIDER)!;
}
