import { getTinyMCE } from "editor_tiny/loader";
import { getPluginMetadata } from "editor_tiny/utils";

const component = "local_teacheraide";
const pluginName = "local_teacheraide/tinymce";

export default async function initTinyMCE() {
  console.log("initTinyMCE function called");
  try {
    /**
     * @import tinymce from "tinymce";
     * @type {[tinymce, object]}
     */

    const [tinyMCE, pluginMetadata] = await Promise.all([
      getTinyMCE(),
      getPluginMetadata(component, pluginName),
    ]);

    console.log("TinyMCE and pluginMetadata loaded");

    tinyMCE.PluginManager.add(pluginName, (editor) => {
      // Plugin setup code
      editor.ui.registry.addButton("teacheraide", {
        text: "Teacher Aide",
        onAction: () => {
          // Button click handler
          editor.windowManager.open({
            title: "Teacher Aide",
            body: {
              type: "panel",
              items: [
                {
                  type: "textarea",
                  name: "content",
                  label: "Enter your text",
                },
              ],
            },
            buttons: [
              {
                type: "submit",
                text: "Insert",
              },
            ],
            onSubmit: (api) => {
              const data = api.getData();
              editor.insertContent(data.content);
              api.close();
            },
          });
        },
      });

      return pluginMetadata;
    });

    console.log(`${pluginName} plugin registered successfully`);

    return tinyMCE;
  } catch (error) {
    console.error(`Failed to register ${pluginName} plugin:`, error);
    return undefined;
  }
}
