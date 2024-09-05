import SimpleChat from "./components/SimpleChat.vue";
import { configureAppWithProviders } from "./provider";

import { defineCustomElement } from "vue";
import { OpenAI } from "openai";

import registerTinyMCEPlugin from "./tinymce/init";
import { webserviceBaseUrl, webserviceFetch } from "./webservice";

type InitOptions = {
  endpoint: string;
  apiVersion: string;
  deployment: string;
  apiKey: string;
  baseURL: string;
  model: string;
};

async function init({ apiKey, model }: InitOptions) {
  const client = new OpenAI({
    baseURL: webserviceBaseUrl,
    apiKey,
    dangerouslyAllowBrowser: true,
    fetch: webserviceFetch,
  });

  const configureApp = configureAppWithProviders({ model, client });

  await registerTinyMCEPlugin();

  // Register the custom element
  customElements.define(
    "teacheraide-simple-chat",
    defineCustomElement(SimpleChat, { configureApp }),
  );
}

export { init };
