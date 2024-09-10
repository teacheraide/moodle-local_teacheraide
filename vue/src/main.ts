import SimpleChat from "./components/SimpleChat.vue";
import { configureAppWithProviders } from "./provider";

import { defineCustomElement } from "vue";
import { OpenAI } from "openai";

import registerTinyMCEPlugin from "./tinymce/init";
import { webserviceBaseUrl, webserviceFetch } from "./webservice";

interface InitOptions {
  systemPrompt: string;
}

async function init({ systemPrompt }: InitOptions) {
  const client = new OpenAI({
    baseURL: webserviceBaseUrl,
    apiKey: "dummy",
    dangerouslyAllowBrowser: true,
    fetch: webserviceFetch,
  });

  const configureApp = configureAppWithProviders({ client, systemPrompt });

  await registerTinyMCEPlugin();

  // Register the custom element
  customElements.define(
    "teacheraide-simple-chat",
    defineCustomElement(SimpleChat, { configureApp }),
  );
}

export { init };
