<script setup lang="ts">
import { ref } from "vue";
import SimpleChat from "./SimpleChat.vue";
import ChatHistory from "./ChatHistory.vue";
import HelpDialog from "./HelpDialog.vue";

const showChat = ref(false);
const inputMessage = ref("");
const chatHistoryRef = ref<InstanceType<typeof ChatHistory> | null>(null);
const helpDialogRef = ref<InstanceType<typeof HelpDialog> | null>(null);

// Add handlers for chat history and help
const displayChatHistory = async () => {
  chatHistoryRef.value?.show();
};

const displayHelp = async () => {
  helpDialogRef.value?.show();
};

const handleAskTeacher = () => {
  if (inputMessage.value.trim()) {
    showChat.value = true;
  }
};

const handleClose = () => {
  showChat.value = false;
  inputMessage.value = ""; // Reset input when closing
};

const backToHome = () => {
  showChat.value = false;
  inputMessage.value = ""; // Reset input when returning to home
};
</script>

<template>
  <div v-if="!showChat" class="home-container">
    <img @click="handleClose" src="../assets/close_icon.svg" alt="close" class="close-icon" />

    <div class="content-container">
      <h1 class="title">TeacherAIde</h1>
      <p class="subtitle">Your personal teaching assistant</p>

      <div class="input-container">
        <input
          v-model="inputMessage"
          type="text"
          placeholder="Ask TeacherAIde..."
          class="ask-input"
          @keyup.enter="handleAskTeacher"
        />
        <img
          @click="handleAskTeacher"
          src="../assets/send_icon_3.svg"
          alt="send"
          class="send-icon"
        />
      </div>
    </div>

    <div class="navigation">
      <img
        @click="displayChatHistory"
        src="../assets/list_icon.svg"
        alt="chat history"
        class="nav-icon"
      />
      <img src="../assets/home_icon.svg" alt="home" class="nav-icon active" />
      <img @click="displayHelp" src="../assets/help_icon.svg" alt="help" class="nav-icon" />
    </div>

    <!-- Add dialog components -->
    <ChatHistory ref="chatHistoryRef" />
    <HelpDialog ref="helpDialogRef" />
  </div>

  <SimpleChat v-else :text-message="inputMessage" @back-to-home="backToHome" />
</template>

<style scoped>
.home-container {
  width: 90%;
  max-width: 500px;
  height: 90vh;
  margin: 20px auto;
  background: white;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  position: relative;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.close-icon {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 15px;
  height: 15px;
  cursor: pointer;
}

.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.title {
  color: #003274;
  font-size: 32px;
  font-weight: 600;
  margin: 0;
}

.subtitle {
  color: #666;
  margin-top: 8px;
}

.input-container {
  margin-top: 24px;
  width: calc(100% - 40px);
  max-width: 400px;
  position: relative;
}

.ask-input {
  width: calc(100% - 40px);
  padding: 12px 20px 12px 20px;
  border-radius: 25px;
  border: none;
  background-color: #003274;
  color: white;
  font-size: 16px;
  outline: none;
}

.ask-input::placeholder {
  color: rgba(255, 255, 255, 0.8);
}

.send-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.navigation {
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #e5e7eb;
}

.nav-icon {
  width: 24px;
  height: 24px;
  cursor: pointer;
  opacity: 0.5;
}

.nav-icon.active {
  opacity: 1;
}
</style>
