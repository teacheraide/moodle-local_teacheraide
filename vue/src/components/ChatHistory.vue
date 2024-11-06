<script setup lang="ts">
import { ref } from "vue";
import { useChatboxStore } from "@/store/chatbox";
import { marked } from "marked";

const chatbox = useChatboxStore();
const isVisible = ref(false);

const show = () => {
  isVisible.value = true;
};

const hide = () => {
  isVisible.value = false;
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

      <div class="chat-history-content">
        <div class="chat-history-empty-container">
          <div class="chat-history-empty">
            <p>Your chat history is currently empty.</p>
            <p>Return to Home screen and start a new conversation!</p>
          </div>
        </div>
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
  border: 1px solid #e5e7eb;
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
  font-size: 16px;
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

.chat-history-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.chat-history-empty-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  padding: 0 20px;
}

.chat-history-empty {
  text-align: center;
  color: #666;
}

.chat-history-empty p {
  margin: 8px 0;
  line-height: 1.5;
}
</style>
