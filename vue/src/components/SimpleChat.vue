<script setup lang="ts">
import { useAI } from "@/provider";
import { onMounted, ref } from "vue";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/index.mjs";
import { marked } from "marked";

type ChatMessage = ChatCompletionCreateParamsNonStreaming["messages"][0];

const models = ref<string[]>([]);
const selectedModel = ref("");

const { client, systemPrompt } = useAI();

const messages = ref<ChatMessage[]>([{ role: "system", content: systemPrompt }]);
const newMessage = ref("");

const fetchModels = async () => {
  const response = await client.models.list();
  models.value = response.data.map((model) => model.id);
};

const sendMessage = async () => {
  if (!newMessage.value) return;

  messages.value.push({
    content: newMessage.value,
    role: "user",
  });

  const response = await client.chat.completions.create({
    model: selectedModel.value,
    messages: messages.value,
  });

  messages.value.push({
    content: response.choices[0].message.content,
    role: "assistant",
  });

  newMessage.value = "";
};

onMounted(async () => {
  await fetchModels();
  selectedModel.value = models.value[0];
});
</script>

<template>
  <!-- <div data-theme="light">
    <h1>Test List Models</h1>
    <div v-if="isFetching">Loading...</div>
    <div v-else-if="isFetched">
      <pre>{{ data }}</pre>
    </div>

    <button class="btn btn-primary" @click="refetch()">List Models</button>
  </div> -->
  <div class="max-w-lg mx-auto p-4 border border-gray-300 rounded-lg shadow-md">
    <div class="mb-4">
      <h2 class="text-xl font-semibold">Chat</h2>
      <div class="mb-2">
        <label for="model-select" class="block text-gray-700">Select Model:</label>
        <select
          id="model-select"
          v-model="selectedModel"
          class="select select-bordered select-sm w-full max-w-xs"
        >
          <option v-for="model in models" :key="model" :value="model">{{ model }}</option>
        </select>
      </div>
    </div>
    <div class="mb-4">
      <div v-for="(message, index) in messages" :key="index" class="mb-2">
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
        v-model="newMessage"
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
