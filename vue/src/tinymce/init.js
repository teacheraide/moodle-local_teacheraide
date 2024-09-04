import { getTinyMCE } from "editor_tiny/loader";
import { getPluginMetadata } from "editor_tiny/utils";

const component = "local_teacheraide";
const pluginName = "local_teacheraide/tinymce";

export default async function register() {
  // Note: The PluginManager.add function does not support asynchronous configuration.
  // Perform any asynchronous configuration here, and then call the PluginManager.add function.

  /**
   * @import tinymce from "tinymce";
   * @type {[tinymce, object]}
   */
  const [tinyMCE, pluginMetadata] = await Promise.all([
    getTinyMCE(),
    getPluginMetadata(component, pluginName),
    // getCommandSetup(),
  ]);

  console.log(tinyMCE, "hello world");
  // Reminder: Any asynchronous code must be run before this point.
  tinyMCE.PluginManager.add(pluginName, (editor) => {
    console.log(editor);
    // Register any options that your plugin has
    // registerOptions(editor);
    // Setup any commands such as buttons, menu items, and so on.
    // setupCommands(editor);
    // Return the pluginMetadata object. This is used by TinyMCE to display a help link for your plugin.
    // return pluginMetadata;
    return pluginMetadata;
  });
}
