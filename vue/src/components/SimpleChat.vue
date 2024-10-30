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
  const copyText = async () => {
    try {
      console.log(`userMessages ${typeof chatbox.userMessages}`);
      console.log(chatbox.userMessages.length);
      console.log(chatbox.userMessages);
      if(chatbox.userMessages.length>0){
        //console.log(chatbox.userMessages[0]);
      }
      //await navigator.clipboard.writeText(props.text);
      //alert("Hello");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };


onMounted(async () => {
  await fetchModels();
  chatbox.setSystemPrompt(systemPrompt);
});

</script>

<template>
  <div data-theme="light" class="max-w-lg mx-auto p-4 border border-gray-300 rounded-lg shadow-md">
    <div class="mb-4">
      <button @click="clearMessages" class="btn btn-error btn-sm float-right">
        Clear Messages
      </button>
      <button
        @click="copyText"
        class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        Copy Last Response
      </button>
      
      <h2 class="text-xl font-semibold">Chat</h2>
      <div class="mb-2" v-if="chatbox.models.length > 0">
        <label for="model-select" class="block text-gray-700">Select Model:</label>
        <select
          id="model-select"
          v-model="chatbox.selectedModel"
          class="select select-bordered select-sm w-full max-w-xs"
        >
          <option v-for="model in chatbox.models" :key="model" :value="model">{{ model }}</option>
        </select>
      </div>
    </div>
    <div class="mb-4">
      <div v-for="(message, index) in chatbox.messages" :key="index" class="mb-2">
        <div v-if="message.role === 'system'" class="text-center">
          <p class="text-gray-500">{{ message.content }}</p>
        </div>
        <div v-if="message.role !== 'system'" :class="{ 'text-right': message.role === 'user' }">
          <div
            class="inline-block p-2 rounded-lg"
            :class="message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'"
            v-html="marked.parse(message.content as string)"
          ></div>
        </div>
      </div>
    </div>
    <div class="flex">
      <input
        v-model="chatbox.newMessage"
        @keyup.enter="sendMessage"
        type="text"
        placeholder="Type a message..."
        class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        @click="sendMessage"
        class="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Send
      </button>
    </div>
  </div>
</template>

<style scoped>
@import "../assets/main.css";
</style>
