import { defineStore } from "pinia";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/index.mjs";

type ChatMessage = ChatCompletionCreateParamsNonStreaming["messages"][0];

export const useChatboxStore = defineStore("chatbox", {
  state: () => ({
    models: [] as string[],
    selectedModel: "",
    systemPrompt: "",
    userMessages: [] as ChatMessage[],
    newMessage: "",
    maxTokens: 5000,
  }),
  actions: {
    setSystemPrompt(prompt: string) {
      this.systemPrompt = prompt;
    },
    setModels(models: string[]) {
      this.models = models;
    },
    setSelectedModel(model: string) {
      this.selectedModel = model;
    },
    addMessage(message: ChatMessage) {
      this.userMessages.push(message);
    },
    setNewMessage(message: string) {
      this.newMessage = message;
    },
    clearNewMessage() {
      this.newMessage = "";
    },
    clearMessages() {
      this.userMessages = [];
    },
  },
  getters: {
    messages: (state) => {
      return [
        ...((state.systemPrompt
          ? [{ role: "system", content: state.systemPrompt }]
          : []) as ChatMessage[]),
        ...state.userMessages,
      ];
    },
  },
});
