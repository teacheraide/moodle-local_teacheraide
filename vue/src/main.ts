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
  // Create OpenAI client
  const client = new OpenAI({
    baseURL: webserviceBaseUrl,
    apiKey: "dummy", // This is a dummy API key, as the API key is not needed for using the webservice
    dangerouslyAllowBrowser: true,
    fetch: webserviceFetch,
  });

  // Configure the app with providers
  const configureApp = configureAppWithProviders({ client, systemPrompt });

  // Register the TinyMCE plugin
  await registerTinyMCEPlugin();

  // Register the custom element
  customElements.define(
    "teacheraide-simple-chat",
    defineCustomElement(SimpleChat, { configureApp }),
  );
}

export { init };
