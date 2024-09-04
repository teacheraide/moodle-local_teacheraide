// import { getTinyMCE } from "editor_tiny/loader";
// import { getPluginMetadata } from "editor_tiny/utils";

export default async function register() {
  // Note: The PluginManager.add function does not support asynchronous configuration.
  // Perform any asynchronous configuration here, and then call the PluginManager.add function.
  // const [tinyMCE, pluginMetadata, setupCommands] = await Promise.all([
  //   getTinyMCE(),
  //   // getPluginMetadata(component, pluginName),
  //   // getCommandSetup(),
  // ]);
  // // Reminder: Any asynchronous code must be run before this point.
  // tinyMCE.PluginManager.add(pluginName, (editor) => {
  //   // Register any options that your plugin has
  //   // registerOptions(editor);
  //   // Setup any commands such as buttons, menu items, and so on.
  //   setupCommands(editor);
  //   // Return the pluginMetadata object. This is used by TinyMCE to display a help link for your plugin.
  //   return pluginMetadata;
  // });
}
