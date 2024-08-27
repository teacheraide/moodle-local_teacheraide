import SimpleChat from "./components/SimpleChat.vue";
import { configureAppWithProviders } from "./provider";

import { defineCustomElement } from "vue";
import { OpenAI } from "openai";
interface InitParams {
  endpoint: string;
  apiVersion: string;
  deployment: string;
  apiKey: string;
  baseURL: string;
  model: string;
}

function init({ apiKey, baseURL, model }: InitParams) {
  const client = new OpenAI({ baseURL, apiKey, dangerouslyAllowBrowser: true });

  const configureApp = configureAppWithProviders({ model, client });

  const SimpleChatElement = defineCustomElement(SimpleChat, { configureApp });

  // Register the custom element
  customElements.define("teacheraide-simple-chat", SimpleChatElement);
}

export { init };
