<script setup lang="ts">
import { useAI } from "@/provider";
import { onMounted } from "vue";
import { useChatboxStore } from "@/store/chatbox";
import { marked } from "marked";
const chatbox = useChatboxStore();
const { client, systemPrompt } = useAI();

const fetchModels = async () => {
  try {
    const response = await client.models.list();
    chatbox.setModels(response.data.map((model) => model.id));
    chatbox.setSelectedModel(chatbox.models[0]);
  } catch (error) {
    console.error("Failed to fetch models:", error);
    // Handle the error, maybe notify the user
  }
};

const controller = new AbortController();

const sendMessage = async () => {
  if (!chatbox.newMessage) return;

  chatbox.addMessage({
    content: chatbox.newMessage,
    role: "user",
  });

  try {
    const response = await client.chat.completions.create(
      {
        model: chatbox.selectedModel,
        messages: chatbox.messages,
        max_tokens: chatbox.maxTokens,
      },
      { signal: controller.signal },
    );

    chatbox.addMessage({
      content: response.choices[0].message.content,
      role: "assistant",
    });
  } catch (error) {
    console.error("Failed to send message:", error);
    // Handle the error, maybe notify the user
  } finally {
    chatbox.clearNewMessage();
  }
};

const clearMessages = () => {
  controller.abort();
  chatbox.clearMessages();
};

// Props are used to pass the text from the parent component
  const props = defineProps<{ text: string }>();
  
    // Function to copy the provided text to the clipboard
const copyText = async (event: MouseEvent) => {
  try {
    // Find the closest parent element containing the <p> tag
    const paragraphContent = (event.target as HTMLElement).closest('.inline-block.p-2.rounded-lg')?.querySelector('p')?.textContent;
    
    if (paragraphContent) {
      // Copy text to clipboard
      await navigator.clipboard.writeText(paragraphContent);
      alert(`copied ${paragraphContent} to clipboard!`);
    } else {
      console.warn('No text found in <p> tag');
    }
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};

const refreshText = async (event: MouseEvent) => {
  try {
    // Find the closest parent element containing the <p> tag
    const paragraphContent = (event.target as HTMLElement).closest('.inline-block.p-2.rounded-lg')?.querySelector('p')?.textContent;
    
    if (paragraphContent) {
      // Copy text to clipboard
      await navigator.clipboard.writeText(paragraphContent);
      alert(`copied ${paragraphContent} to clipboard!`);
    } else {
      console.warn('No text found in <p> tag');
    }
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};

const shareText = async (event: MouseEvent) => {
  try {
    // Find the closest parent element containing the <p> tag
    const paragraphContent = (event.target as HTMLElement).closest('.inline-block.p-2.rounded-lg')?.querySelector('p')?.textContent;
    
    if (paragraphContent) {
      // Copy text to clipboard
      await navigator.clipboard.writeText(paragraphContent);
      alert(`copied ${paragraphContent} to clipboard!`);
    } else {
      console.warn('No text found in <p> tag');
    }
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};

const displayOptions = async (event: MouseEvent) => {

};

const goHome = async (event: MouseEvent) => {
  
};

const displayHelp = async (event: MouseEvent) => {
  
};


onMounted(async () => {
  await fetchModels();
  chatbox.setSystemPrompt(systemPrompt);
});

</script>

<template>
<style>
  :root{
          --primary-color: #366FBD;      /* Main brand color */
          --secondary-color: #E7EEF7;    /* Accent color */
          --background-color: #B8CCE8;   /* Background color */
          --text-primary-color: #003274;         /* Main text color */
          --text-secondary-color: #c1c4c5;
          --border-color: #000000;
          --icon-size: 20px;
      }
  .teacheraide-chat-box-messagebox-options-icon{
          width: 10px;
          height:10px;
          
          margin: 0px;
          color: var(--text-secondary-color) !important;
      }
      .teacheraide-chat-box-messagebox-options-icon:hover{
          color: var(--text-secondary-color);
          cursor: pointer;
      }
      
      .my-input::placeholder {
        color: white !important; /* Change to any color you prefer */
        opacity: 1; /* Optional: ensures color appears solid */
      }
      


</style>
  <div data-theme="light" class="max-w-lg mx-auto p-4 border border-gray-300 rounded-lg shadow-md">
    <img @click="clearMessages" src="../assets/close_icon.svg"    alt="copy"    style="width:15px;height:15px;margin:5px;position:relative;right:calc(0% - 15px);"  title="clear"> 
    
    
    <div class="mb-4">
      <!--<button @click="clearMessages" class="btn btn-error btn-sm float-right">Clear Messages</button>-->
      <!--<button @click="copyText"  class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500" > Copy Last Response</button>-->
      
     <h2 class="text-xl font-semibold" style="color:#003274">TeacherAIde</h2>
    </div>
    <div class="mb-4" style=" overflow:scroll; height:70%;" id="teacheraide-chat-container">
      <div v-for="(message, index) in chatbox.messages" :key="index" class="mb-2">
        <div v-if="message.role === 'system'" class="text-center">
          <p class="text-gray-500">{{ message.content }}</p>
        </div>
        <div v-if="message.role !== 'system'" :class="{ 'text-right': message.role === 'user' }" >
          <div  class="inline-block p-2 rounded-lg" :class="message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'" style="min-width:100px;max-width:100%;background-color:#003274;">
            <div class="inline-block p-2 rounded-lg" :class="message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'"  v-html="marked.parse(message.content as string)" style="background-color:#003274;line-height:.9">
            
            </div>
            <div class="teacheraide-chat-box-messagebox-options" style="align-content:left;align-items:left;align-text:left !important; display:flex;">
                <img @click="copyText" src="../assets/copy_icon.svg"    alt="copy"    style="width:15px;height:15px;margin:5px;"  title="copy"> 
                <img @click="refreshText" src="../assets/refresh_icon.svg"    alt="like"    style="width:15px;height:15px;margin:5px;" title="refresh">
                <img @click="shareText" src="../assets/share_icon.svg"   alt="dislike" style="width:15px;height:15px;margin:5px;" title="share">
            </div>
          </div>
          
        </div>
      </div>
    </div>
    <div class="flex"  style="background-color:#003274;border-radius:10px;">
      <input v-model="chatbox.newMessage" @keyup.enter="sendMessage"  type="text" placeholder="Type a message..."  class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 my-input" style="background-color:#003274; color: white;border: none;outline: none;"/>
      <img @click="sendMessage" src="../assets/send_icon_3.svg" alt="send" style="width:30px;height:30px;margin:5px;color:white;background-color:#003274;" title="send">
      
      <!--<button class="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500" style="background-color:#003274;"> Send </button>-->
    </div>
    <div style="width:100%;display: flex;justify-content: space-between;align-items: center;padding: 10px; background-color: #f8f9fa;">
    <img @click="displayOptions" src="../assets/list_icon.svg" alt="options"  style="width:30px;height:30px;order: 1;margin-right: auto;" title="options">
    <img @click="goHome" src="../assets/home_icon.svg" alt="home"             style="width:30px;height:30px;order: 2;text-align: center;flex-grow: 1;" title="home">
    <img @click="displayHelp" src="../assets/help_icon.svg" alt="help"        style="width:30px;height:30px;order: 3;margin-left: auto;" title="help">
    </div>

    
  </div>
</template>

<style scoped>
@import "../assets/main.css";
</style>
