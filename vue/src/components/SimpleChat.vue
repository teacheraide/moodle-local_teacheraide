<script setup lang="ts">
import { useAI } from "@/provider";
import { onMounted, ref } from "vue";
import { useChatboxStore } from "@/store/chatbox";
import { marked } from "marked";
import ChatHistory from "./ChatHistory.vue";
import HelpDialog from "./HelpDialog.vue";

// Define props with proper types
interface Props {
  textMessage: string;
}

const props = defineProps<Props>();

// Define emits
const emit = defineEmits<{
  (e: "back-to-home"): void;
}>();

const chatbox = useChatboxStore();
const { client, systemPrompt } = useAI();

const chatHistoryRef = ref<InstanceType<typeof ChatHistory> | null>(null);
const helpDialogRef = ref<InstanceType<typeof HelpDialog> | null>(null);

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

  // Add user message immediately
  const userMessage = chatbox.newMessage;
  chatbox.addMessage({
    content: userMessage,
    role: "user",
  });

  // Clear input right after sending
  chatbox.clearNewMessage();

  try {
    // Get AI response
    const response = await client.chat.completions.create(
      {
        model: chatbox.selectedModel,
        messages: chatbox.messages,
        max_tokens: chatbox.maxTokens,
      },
      { signal: controller.signal },
    );

    // Add AI response when received
    chatbox.addMessage({
      content: response.choices[0].message.content,
      role: "assistant",
    });
  } catch (error) {
    console.error("Failed to send message:", error);
  }
};

const clearMessages = () => {
  controller.abort();
  chatbox.clearMessages();
};

// Function to copy the provided text to the clipboard
const copyText = async (event: MouseEvent) => {
  try {
    // Find the closest parent element containing the <p> tag
    const paragraphContent = (event.target as HTMLElement)
      .closest(".inline-block.p-2.rounded-lg")
      ?.querySelector("p")?.textContent;

    if (paragraphContent) {
      // Copy text to clipboard
      await navigator.clipboard.writeText(paragraphContent);
      alert(`copied ${paragraphContent} to clipboard!`);
    } else {
      console.warn("No text found in <p> tag");
    }
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};

const refreshText = async (event: MouseEvent) => {
  try {
    // Find the closest parent element containing the <p> tag
    const paragraphContent = (event.target as HTMLElement)
      .closest(".inline-block.p-2.rounded-lg")
      ?.querySelector("p")?.textContent;

    if (paragraphContent) {
      // Copy text to clipboard
      await navigator.clipboard.writeText(paragraphContent);
      alert(`copied ${paragraphContent} to clipboard!`);
    } else {
      console.warn("No text found in <p> tag");
    }
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};

const shareText = async (event: MouseEvent) => {
  try {
    // Find the closest parent element containing the <p> tag
    const paragraphContent = (event.target as HTMLElement)
      .closest(".inline-block.p-2.rounded-lg")
      ?.querySelector("p")?.textContent;

    if (paragraphContent) {
      // Copy text to clipboard
      await navigator.clipboard.writeText(paragraphContent);
      alert(`copied ${paragraphContent} to clipboard!`);
    } else {
      console.warn("No text found in <p> tag");
    }
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};
const displayChatHistory = async (event: MouseEvent) => {
  try {
    if (!chatHistoryRef.value) {
      console.warn("Chat history component not initialized");
      return;
    }
    await chatHistoryRef.value.show();
    console.log("Chat history displayed successfully");
  } catch (err) {
    console.error("Failed to display chat history:", err);
    alert("Failed to open chat history. Please try again.");
  }
};
const goHome = async (event: MouseEvent) => {
  try {
    console.log("Home navigation to be implemented");
    alert("Home navigation coming soon!");
  } catch (err) {
    console.error("Failed to navigate home:", err);
  }
};

const displayHelp = async (event: MouseEvent) => {
  try {
    if (!helpDialogRef.value) {
      console.warn("Help dialog component not initialized");
      return;
    }
    await helpDialogRef.value.show();
    console.log("Help dialog displayed successfully");
  } catch (err) {
    console.error("Failed to display help dialog:", err);
    alert("Failed to open help. Please try again.");
  }
};

// Use the textMessage prop when initializing the chat
onMounted(() => {
  if (props.textMessage) {
    chatbox.newMessage = props.textMessage;
    sendMessage();
  }
});

const handleClose = () => {
  console.log(`close window`);
  let chatwindow = document.getElementById('chat-screen');
  if (chatwindow) {
      chatwindow.style.display = 'none';
  }
};
</script>

<template>
  <div class="chat-container">
    <div class="header">
      <h2 class="title">TeacherAIde</h2>
      <img
        @click="handleClose"
        src="../assets/close_icon.svg"
        alt="close"
        class="close-icon"
        title="close"
      />
    </div>

    <div class="messages-container">
      <div v-if="chatbox.messages.length === 0" class="empty-state">
        <p>You are a helpful assistant that aids teachers.</p>
      </div>

      <div v-else v-for="(message, index) in chatbox.messages" :key="index" class="message-wrapper">
        <div v-if="message.role === 'user'" class="user-message">
          <div class="message-content">
            {{ message.content }}
          </div>
        </div>

        <div v-if="message.role === 'assistant'" class="assistant-message">
          <div class="assistant-label">TeacherAIde:</div>
          <div class="message-content" v-html="marked.parse(message.content as string)"></div>
          <div class="message-actions">
            <img
              @click="copyText"
              src="../assets/copy_icon.svg"
              alt="copy"
              class="action-icon"
              title="copy"
            />
            <img
              @click="refreshText"
              src="../assets/refresh_icon.svg"
              alt="refresh"
              class="action-icon"
              title="refresh"
            />
            <img
              @click="shareText"
              src="../assets/share_icon.svg"
              alt="share"
              class="action-icon"
              title="share"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-container">
      <div class="input-wrapper">
        <div class="input-area">
          <input
            v-model="chatbox.newMessage"
            @keyup.enter="sendMessage"
            type="text"
            placeholder="Ask TeacherAIde..."
            class="message-input"
          />
          <img
            @click="sendMessage"
            src="../assets/send_icon_3.svg"
            alt="send"
            class="send-icon"
            title="send"
          />
        </div>
      </div>

      <div class="navigation">
        <img
          @click="displayChatHistory"
          src="../assets/list_icon.svg"
          alt="chat history"
          class="nav-icon"
          title="chat history"
        />
        <img
          @click="goHome"
          src="../assets/home_icon.svg"
          alt="home"
          class="nav-icon"
          title="home"
        />
        <img
          @click="displayHelp"
          src="../assets/help_icon.svg"
          alt="help"
          class="nav-icon"
          title="help"
        />
      </div>
    </div>

    <ChatHistory ref="chatHistoryRef" />
    <HelpDialog ref="helpDialogRef" />
  </div>
</template>

<style scoped>
.chat-container {
  width: 90%;
  max-width: 500px;
  height: 90vh;
  margin: 20px auto;
  background: white;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  color: #003274;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.close-icon {
  width: 15px;
  height: 15px;
  cursor: pointer;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-wrapper {
  margin-bottom: 8px;
  width: 100%;
}

.user-message {
  margin-bottom: 4px;
}

.user-message .message-content {
  color: #003274;
  text-align: left;
  font-weight: 800;
}

/* Assistant message styling */
.assistant-message {
  background-color: #f8f9fa;
  padding: 16px 32px;
  margin: 0 -32px;
  position: relative;
}

.assistant-label {
  color: #003274;
  font-weight: 800;
  margin-bottom: 4px;
}

.assistant-message .message-content {
  color: #000000;
  text-align: left;
  margin-bottom: 24px;
}

/* Message content with reduced paragraph spacing */
.message-content {
  line-height: 1.4;
  white-space: pre-wrap;
}

.message-content :deep(p) {
  margin: 8px 0; /* Reduced spacing between paragraphs */
}

.message-content :deep(p:first-child) {
  margin-top: 0;
}

.message-content :deep(ul) {
  margin: 4px 0;
  padding-left: 16px;
}

.message-content :deep(li) {
  margin: 2px 0;
}

/* Action icons with black color */
.message-actions {
  position: absolute;
  bottom: 8px;
  left: 32px;
  display: flex;
  gap: 16px;
  align-items: center;
}

.action-icon {
  width: 16px;
  height: 16px;
  cursor: pointer;
  filter: brightness(0); /* Makes icons black */
  opacity: 0.8;
  transition: opacity 0.2s ease;
  padding: 2px;
}

.action-icon:hover {
  opacity: 1;
}

/* Bottom section styles */
.empty-state {
  text-align: center;
  color: #666;
  padding: 16px;
}

.bottom-container {
  margin-top: auto;
}

.input-wrapper {
  padding: 0 16px;
  margin-bottom: 8px;
}

.input-area {
  background-color: #003274;
  border-radius: 25px;
  display: flex;
  align-items: center;
  padding: 8px 16px;
}

.message-input {
  flex: 1;
  padding: 8px;
  border: none;
  background: transparent;
  color: white;
  outline: none;
  font-size: 14px;
}

.message-input::placeholder {
  color: #ffffff;
  opacity: 0.8;
}

.send-icon {
  width: 20px;
  height: 20px;
  cursor: pointer;
  margin-left: 8px;
}

.navigation {
  background: #f8f9fa;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #e5e7eb;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.nav-icon {
  width: 24px;
  height: 24px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

/* Hover effects */
.nav-icon:hover,
.send-icon:hover,
.close-icon:hover {
  opacity: 0.8;
}

/* Scrollbar styling */
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}
</style>
