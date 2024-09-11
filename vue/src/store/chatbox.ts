import { defineStore } from "pinia";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/index.mjs";

type ChatMessage = ChatCompletionCreateParamsNonStreaming["messages"][0];

export const useChatboxStore = defineStore('chatbox', {
  state: () => ({
    models: [] as string[],
    selectedModel: '',
    messages: [{ role: 'system', content: 'Your system prompt here' }] as ChatMessage[],
    newMessage: ''
  }),
  actions: {
    setModels(models: string[]) {
      this.models = models;
    },
    setSelectedModel(model: string) {
      this.selectedModel = model;
    },
    addMessage(message: ChatMessage) {
      this.messages.push(message);
    },
    setNewMessage(message: string) {
      this.newMessage = message;
    },
    clearNewMessage() {
      this.newMessage = '';
    }
  }
});
