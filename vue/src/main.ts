import { OpenAI } from "openai";
import SimpleChat from "./components/SimpleChat.vue";
import SimpleChatOllama from "./components/SimpleChatOllama.vue";
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

function init({ deployment, apiKey, endpoint }: InitParams) {
  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
    // fetch: async (input: RequestInfo, init?: RequestInit) => {
    //   console.log("input", input, init);

    //   const responses = await fetchMany([
    //     {
    //       methodname: functionName,
    //       args: {
    //         endpoint: input.toString().replace(baseUrl, ""),
    //         method: init?.method,
    //         params: JSON.stringify(init?.body),
    //       },
    //     },
    //   ]);

    //   // const response = await fetch(fullUrl, init);
    //   return responses[0];
    // },
  });

  const ollama = new Ollama({ host: endpoint });

  const configureApp = configureAppWithProviders({ openai, model: deployment, ollama });

  const SimpleChatElement = defineCustomElement(SimpleChat, { configureApp });
  const SimpleChatElementOllama = defineCustomElement(SimpleChatOllama, { configureApp });

  // Register the custom element
  customElements.define("teacheraide-simple-chat", SimpleChatElement);
  customElements.define("teacheraide-simple-chat-ollama", SimpleChatElementOllama);
}

export { init };
