<script setup lang="ts">
import { ref, computed } from "vue";
import { useChatboxStore } from "@/store/chatbox";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
}

const emit = defineEmits<{
  (e: "loadChat", chat: ChatSession): void;
}>();

const chatbox = useChatboxStore();
const isVisible = ref(false);
const searchQuery = ref("");
const hoveredChatId = ref<string | null>(null);

const filteredChats = computed(() => {
  if (!searchQuery.value) return chatbox.chatHistory;
  const query = searchQuery.value.toLowerCase();
  return chatbox.chatHistory.filter(
    (chat) =>
      chat.title.toLowerCase().includes(query) ||
      chat.messages.some((msg) => msg.content.toLowerCase().includes(query)),
  );
});

const formatDate = (date: Date) => {
  if (!date) return "";
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const selectChat = (chatId: string) => {
  chatbox.loadChat(chatId);
  hide();
};

const show = () => {
  isVisible.value = true;
};

const hide = () => {
  isVisible.value = false;
  hoveredChatId.value = null;
};

defineExpose({ show, hide });
</script>

<template>
  <div v-if="isVisible" class="chat-history-overlay">
    <div class="chat-history-modal">
      <div class="chat-history-header">
        <h2 class="chat-history-title">TeacherAIde</h2>
        <div class="chat-history-subtitle">Chat History</div>
        <img @click="hide" src="../assets/close_icon.svg" alt="close" class="chat-history-close" />
      </div>

      <div class="chat-history-search-container">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search your chats..."
          class="chat-history-search-input"
        />
      </div>

      <div class="chat-history-content">
        <template v-if="filteredChats.length === 0">
          <div class="chat-history-empty-container">
            <div class="chat-history-empty">
              <p>Your chat history is currently empty.</p>
              <p>Return to Home screen and start a new conversation!</p>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="chat-history-list">
            <div
              v-for="chat in filteredChats"
              :key="chat.id"
              class="chat-history-item"
              :class="{ active: hoveredChatId === chat.id }"
              @mouseenter="hoveredChatId = chat.id"
              @mouseleave="hoveredChatId = null"
              @click="selectChat(chat.id)"
            >
              <div class="chat-title">{{ chat.title }}</div>
              <div class="chat-date">{{ formatDate(chat.timestamp) }}</div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-history-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.chat-history-modal {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-history-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
}

.chat-history-title {
  color: #003274;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.chat-history-subtitle {
  color: #93a3bc;
  font-size: 18px;
  margin-top: 4px;
}

.chat-history-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 15px;
  height: 15px;
  cursor: pointer;
}

.chat-history-search-container {
  padding: 12px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.chat-history-search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.chat-history-search-input:focus {
  border-color: #003274;
}

.chat-history-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.chat-history-empty-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #6b7280;
}

.chat-history-empty {
  padding: 20px;
}

.chat-history-empty p {
  margin: 4px 0;
}

.chat-history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-history-item {
  background-color: #e7eef7;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chat-history-item.active {
  background-color: #b8cce8;
}

.chat-title {
  font-size: 16px;
  color: #003274;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-date {
  font-size: 12px;
  color: #4a5568;
}

/* Hover effects */
.chat-history-close:hover {
  opacity: 0.8;
}

/* Scrollbar styling */
.chat-history-content::-webkit-scrollbar {
  width: 6px;
}

.chat-history-content::-webkit-scrollbar-track {
  background: transparent;
}

.chat-history-content::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

.chat-history-content::-webkit-scrollbar-thumb:hover {
  background: #c4c4c4;
}
</style>
