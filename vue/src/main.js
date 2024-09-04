import SimpleChat from "./components/SimpleChat.vue";
import { configureAppWithProviders } from "./provider";

import { defineCustomElement } from "vue";
import { OpenAI } from "openai";

import registerTinyMCEPlugin from "./tinymce/init";
/**
 *
 * @param {object} options
 * @param {string} options.endpoint
 * @param {string} options.apiVersion
 * @param {string} options.deployment
 * @param {string} options.apiKey
 * @param {string} options.baseURL
 * @param {string} options.model
 * @returns
 */
async function init({ apiKey, baseURL, model }) {
  const client = new OpenAI({ baseURL, apiKey, dangerouslyAllowBrowser: true });

  const configureApp = configureAppWithProviders({ model, client });

  const SimpleChatElement = defineCustomElement(SimpleChat, { configureApp });

  await registerTinyMCEPlugin();

  // Register the custom element
  customElements.define("teacheraide-simple-chat", SimpleChatElement);
}

export { init };
