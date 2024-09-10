import { configureAppWithProviders } from "./provider";
import { defineCustomElement } from "vue";
import { OpenAI } from "openai";
import initTinyMCE from "./tinymce/init";
import { webserviceBaseUrl, webserviceFetch } from "./webservice";
// import SimpleChat from './components/SimpleChat.vue'; // Uncomment when SimpleChat is ready

async function init() {
  console.log("Main init function called");
  try {
    const client = new OpenAI({
      baseURL: webserviceBaseUrl,
      apiKey: "dummy",
      dangerouslyAllowBrowser: true,
      fetch: webserviceFetch,
    });

    const configureApp = configureAppWithProviders({ client });

    // Initialize TinyMCE plugin
    const tinyMCE = await initTinyMCE();

    if (tinyMCE) {
      console.log("TinyMCE plugin initialized successfully");
    } else {
      console.warn("TinyMCE plugin initialization returned undefined");
    }

    // Register the custom element
    // Uncomment and adjust when SimpleChat component is ready
    // customElements.define(
    //   "teacheraide-simple-chat",
    //   defineCustomElement(SimpleChat, { configureApp }),
    // );

    console.log("Main initialization completed successfully");
  } catch (error) {
    console.error("Initialization failed:", error);
  }
}

// Export the init function as the default export
export default { init };
