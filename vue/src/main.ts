import SimpleChat from "./components/SimpleChat.vue";
import { configureAppWithProviders } from "./provider";

import { defineCustomElement } from "vue";
import { Ollama } from "ollama/browser";
interface InitParams {
  endpoint: string;
  apiVersion: string;
  deployment: string;
  apiKey: string;
  baseUrl: string;
}

function init({ deployment, endpoint }: InitParams) {
  const ollama = new Ollama({ host: endpoint });

  const configureApp = configureAppWithProviders({ model: deployment, ollama });

  const SimpleChatElement = defineCustomElement(SimpleChat, { configureApp });

  // Register the custom element
  customElements.define("teacheraide-simple-chat", SimpleChatElement);
}

export { init };
