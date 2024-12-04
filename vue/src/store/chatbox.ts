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
    maxTokens: 4096,
    chatHistory: JSON.parse(localStorage.getItem("chatHistory") || "[]").map((chat: any) => ({
      ...chat,
      timestamp: new Date(chat.timestamp),
    })) as ChatSession[],
    currentChatId: localStorage.getItem("currentChatId") || "",
  }),

  actions: {
    setMaxTokens(maxTokens: number) {
      if (maxTokens > 0) {
        this.maxTokens = maxTokens;
      }
    },

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
      this.saveToStorage();
    },

    addMessage(message: Message) {
      this.userMessages.push(message);

      if (!this.currentChatId && message.role === "user") {
        const id = crypto.randomUUID();
        this.currentChatId = id;
        this.chatHistory.unshift({
          id,
          title: message.content.slice(0, 50) + (message.content.length > 50 ? "..." : ""),
          timestamp: new Date(),
          messages: [message],
        });
      } else if (this.currentChatId) {
        const chatIndex = this.chatHistory.findIndex((chat) => chat.id === this.currentChatId);
        if (chatIndex !== -1) {
          this.chatHistory[chatIndex] = {
            ...this.chatHistory[chatIndex],
            messages: [...this.userMessages],
            timestamp: new Date(),
          };
        }
      }
      this.saveToStorage();
    },

    saveToStorage() {
      localStorage.setItem("chatHistory", JSON.stringify(this.chatHistory));
      localStorage.setItem("currentChatId", this.currentChatId);
    },

    clearMessages() {
      this.userMessages = [];
      this.currentChatId = "";
      this.saveToStorage();
    },

    loadChat(chatId: string) {
      const chat = this.chatHistory.find((c) => c.id === chatId);
      if (chat) {
        this.currentChatId = chatId;
        this.userMessages = [...chat.messages];
        this.saveToStorage();
      }
    },

    startNewChat() {
      this.clearMessages();
      this.clearNewMessage();
    },

    clearNewMessage() {
      this.newMessage = "";
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
