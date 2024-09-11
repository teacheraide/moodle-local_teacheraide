import { createApp } from 'vue';
import { createPinia } from 'pinia';
import SimpleChat from './components/SimpleChat.vue';
import { configureAppWithProviders } from './provider';
import { defineCustomElement } from 'vue';
import { OpenAI } from 'openai';
import registerTinyMCEPlugin from './tinymce/init';
import { webserviceBaseUrl, webserviceFetch } from './webservice';

interface InitOptions {
  systemPrompt: string;
}

async function init({ systemPrompt }: InitOptions) {
  // Create OpenAI client
  const client = new OpenAI({
    baseURL: webserviceBaseUrl,
    apiKey: "dummy", // Replace this with the actual API key if necessary
    dangerouslyAllowBrowser: true,
    fetch: webserviceFetch,
  });

  // Create a new Vue app
  const app = createApp(SimpleChat);

  // Set up Pinia
  app.use(createPinia());

  // Configure the app with providers
  const configureApp = configureAppWithProviders({ client, systemPrompt });

  // Register the TinyMCE plugin
  await registerTinyMCEPlugin();

  // Register the custom element
  const SimpleChatElement = defineCustomElement(SimpleChat, { configureApp });
  customElements.define('teacheraide-simple-chat', SimpleChatElement);

  // Mount the Vue app (optional, if you want to render the Vue component directly)
  app.mount('#app');
}

export { init };
