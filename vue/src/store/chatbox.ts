import { defineStore } from "pinia";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
}

export const useChatboxStore = defineStore("chatbox", {
  state: () => ({
    models: [] as string[],
    selectedModel: "",
    systemPrompt: "",
    userMessages: [] as Message[],
    newMessage: "",
    maxTokens: 5000,
    chatHistory: [] as ChatSession[],
    currentChatId: "",
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

    setUserMessages(messages: Message[]) {
      this.userMessages = [...messages];
    },

    addMessage(message: Message) {
      this.userMessages.push(message);

      // If no current chat ID and this is a user message, create a new chat
      if (!this.currentChatId && message.role === "user") {
        const id = crypto.randomUUID();
        this.currentChatId = id;
        this.chatHistory.unshift({
          id,
          title: message.content.slice(0, 50) + (message.content.length > 50 ? "..." : ""),
          timestamp: new Date(),
          messages: [message],
        });
      }
      // If we have a current chat ID, just update the existing chat
      else if (this.currentChatId) {
        const chatIndex = this.chatHistory.findIndex((chat) => chat.id === this.currentChatId);
        if (chatIndex !== -1) {
          // Update the existing chat's messages and timestamp
          this.chatHistory[chatIndex] = {
            ...this.chatHistory[chatIndex],
            messages: [...this.userMessages],
            timestamp: new Date(),
          };
        }
      }
    },

    setNewMessage(message: string) {
      this.newMessage = message;
    },

    clearNewMessage() {
      this.newMessage = "";
    },

    clearMessages() {
      this.userMessages = [];
      this.currentChatId = "";
    },

    loadChat(chatId: string) {
      const chat = this.chatHistory.find((c) => c.id === chatId);
      if (chat) {
        this.currentChatId = chatId;
        this.userMessages = [...chat.messages];
      }
    },

    startNewChat() {
      this.clearMessages();
      this.clearNewMessage();
    },
  },

  getters: {
    messages(): Message[] {
      if (this.systemPrompt) {
        return [{ role: "system", content: this.systemPrompt }, ...this.userMessages];
      }
      return this.userMessages;
    },
  },
});
