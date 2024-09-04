import SimpleChat from "./components/SimpleChat.vue";
import { configureAppWithProviders } from "./provider";

import { defineCustomElement } from "vue";
import { OpenAI } from "openai";
// interface InitParams {
//   endpoint: string;
//   apiVersion: string;
//   deployment: string;
//   apiKey: string;
//   baseURL: string;
//   model: string;
// }

import registerTinyMCEPlugin from "./tinymce/register";

async function init({ apiKey, baseURL, model }) {
  const client = new OpenAI({ baseURL, apiKey, dangerouslyAllowBrowser: true });

  const configureApp = configureAppWithProviders({ model, client });

  const SimpleChatElement = defineCustomElement(SimpleChat, { configureApp });

  await registerTinyMCEPlugin();

  // Register the custom element
  customElements.define("teacheraide-simple-chat", SimpleChatElement);
}

export { init };
