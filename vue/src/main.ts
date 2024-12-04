import HomeScreen from "./components/HomeScreen.vue";
import { configureAppWithProviders } from "./provider";
import { defineCustomElement } from "vue";
import { OpenAI } from "openai";
import { webserviceBaseUrl, webserviceFetch } from "./webservice";

interface InitOptions {
  systemPrompt: string;
  maxTokens: number;
}

async function init(options: InitOptions) {
  const { systemPrompt, maxTokens } = options;
  // Create OpenAI client
  const client = new OpenAI({
    baseURL: webserviceBaseUrl,
    apiKey: "dummy", // This is a dummy API key, as the API key is not needed for using the webservice
    dangerouslyAllowBrowser: true,
    fetch: webserviceFetch,
  });

  // Configure the app with providers
  const configureApp = configureAppWithProviders({ client, systemPrompt, maxTokens });

  // Register the custom element
  customElements.define(
    "teacheraide-simple-chat",
    defineCustomElement(HomeScreen, { configureApp }),
  );
}

export { init };
