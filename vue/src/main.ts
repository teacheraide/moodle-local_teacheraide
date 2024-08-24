import { AzureOpenAI } from "openai";
import SimpleChat from "./components/SimpleChat.vue";
import { configureAppWithProviders } from "./provider";

import { defineCustomElement } from "vue";
interface InitParams {
  endpoint: string;
  apiVersion: string;
  deployment: string;
  apiKey: string;
  baseUrl: string;
}

function init({ apiVersion, deployment, endpoint, apiKey }: InitParams) {
  console.log(apiVersion, deployment, endpoint, apiKey);

  const openai = new AzureOpenAI({
    apiVersion,
    deployment,
    endpoint,
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

  const configureApp = configureAppWithProviders({ openai, model: deployment });

  const SimpleChatElement = defineCustomElement(SimpleChat, { configureApp });

  // Register the custom element
  customElements.define("teacheraide-simple-chat", SimpleChatElement);
}

export { init };
