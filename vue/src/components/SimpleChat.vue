<script setup lang="ts">
import { useAI } from "@/provider";
import { onMounted, ref } from "vue";
import { useChatboxStore } from "@/store/chatbox";
import { marked } from "marked";
import ChatHistory from "./ChatHistory.vue";
import HelpDialog from "./HelpDialog.vue";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { ChatSession } from "@/store/chatbox";

interface Props {
  textMessage: string;
}

const props = defineProps<Props>();

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

  chatbox.clearNewMessage();

  try {
    const messages: ChatCompletionMessageParam[] = chatbox.messages;

    const response = await client.chat.completions.create({
      model: chatbox.selectedModel,
      messages,
      max_tokens: chatbox.maxTokens,
    });

    if (response.choices[0].message.content) {
      chatbox.addMessage({
        content: response.choices[0].message.content,
        role: "assistant",
      });
    }
  } catch (error) {
    console.error("Failed to send message:", error);
  }
};

const goHome = async (event: MouseEvent) => {
  try {
    chatbox.clearMessages();
    chatbox.clearNewMessage();
    chatbox.currentChatId = ""; // Clear current chat ID
    emit("back-to-home");
  } catch (err) {
    console.error("Failed to return to home:", err);
  }
};

const onLoadChat = (chat: ChatSession) => {
  chatbox.currentChatId = chat.id;
  chatbox.setUserMessages(chat.messages);
  chatbox.clearNewMessage();
};

const copyText = async (event: MouseEvent) => {
  try {
    const messageElement = (event.target as HTMLElement)
      .closest(".assistant-message")
      ?.querySelector(".message-content");

    if (messageElement) {
      const textContent = messageElement.textContent || "";

      await navigator.clipboard.writeText(textContent);
      alert("Message copied to clipboard!");
    } else {
      console.warn("Message content not found");
    }
  } catch (err) {
    console.error("Failed to copy:", err);
    alert("Failed to copy message. Please try again.");
  }
};

const refreshText = async (event: MouseEvent) => {
  // TODO: This function need to be refactored, it is not working as expected
  try {
    console.log("Refreshing response...");

    const messageWrappers = document.querySelectorAll(".message-wrapper");
    const currentWrapper = (event.target as HTMLElement).closest(".message-wrapper");

    if (!currentWrapper) {
      console.warn("Could not find message wrapper");
      return;
    }

    const messageIndex = Array.from(messageWrappers).indexOf(currentWrapper);
    console.log("Message wrapper index:", messageIndex);

    if (messageIndex === -1) {
      console.warn("Could not find message index");
      return;
    }

    const messagesUpToThis = chatbox.messages.slice(0, messageIndex);
    console.log("Messages up to this:", messagesUpToThis);

    const response = await client.chat.completions.create({
      model: chatbox.selectedModel,
      messages: [
        ...(chatbox.systemPrompt
          ? [{ role: "system" as const, content: chatbox.systemPrompt }]
          : []),
        ...messagesUpToThis,
      ],
      max_tokens: chatbox.maxTokens,
      temperature: 1.0,
      presence_penalty: 0.6,
      frequency_penalty: 0.6,
      top_p: 0.9,
    });

    if (!response.choices[0].message.content) {
      throw new Error("No response content received");
    }

    const updatedMessages = chatbox.userMessages.map((msg, idx) => {
      if (idx === messageIndex) {
        return {
          content: response.choices[0].message.content!,
          role: "assistant" as const,
        };
      }
      return msg;
    });

    chatbox.clearMessages();
    updatedMessages.forEach((msg) => chatbox.addMessage(msg));
  } catch (err) {
    console.error("Failed to refresh response:", err);
    alert("Failed to generate new response. Please try again.");
  }
};

const shareText = async (event: MouseEvent) => {
  // TODO: share text directly to the tinyMCE editor
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

onMounted(() => {
  if (props.textMessage) {
    chatbox.newMessage = props.textMessage;
    sendMessage();
  }
});

const handleClose = () => {
  console.log(`close window`);
  let chatwindow = document.getElementById("chat-screen");
  if (chatwindow) {
    chatwindow.style.display = "none";
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

      <div v-for="(message, index) in chatbox.messages" :key="index" class="message-wrapper">
        <div v-if="message.role === 'user'" class="user-message">
          <div class="message-content">
            {{ message.content }}
          </div>
        </div>

        <div v-if="message.role === 'assistant'" class="assistant-message">
          <div class="assistant-label">TeacherAIde:</div>
          <div class="message-content" v-html="marked.parse(message.content as string)"></div>
          <div class="message-actions" @click.stop>
            <img
              @click="copyText"
              src="../assets/copy_icon.svg"
              alt="copy"
              class="action-icon"
              title="Copy to clipboard"
            />
            <img
              @click="refreshText"
              src="../assets/refresh_icon.svg"
              alt="refresh"
              class="action-icon"
              title="Regenerate response"
            />
            <img
              @click="shareText"
              src="../assets/share_icon.svg"
              alt="share"
              class="action-icon"
              title="Copy to editor"
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
          title="Chat history"
        />
        <img
          @click="goHome"
          src="../assets/home_icon.svg"
          alt="home"
          class="nav-icon"
          title="Start new chat"
        />
        <img
          @click="displayHelp"
          src="../assets/help_icon.svg"
          alt="help"
          class="nav-icon"
          title="Help"
        />
      </div>
    </div>

    <ChatHistory ref="chatHistoryRef" @load-chat="onLoadChat" />
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
  padding: 16px 20px;
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

.assistant-message {
  background-color: #f8f9fa;
  padding: 16px 20px;
  margin: 0 -20px;
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

.message-content {
  line-height: 1.4;
  white-space: pre-wrap;
}

.message-actions {
  position: absolute;
  bottom: 8px;
  left: 20px;
  display: flex;
  gap: 16px;
  align-items: center;
}

.action-icon {
  width: 16px;
  height: 16px;
  cursor: pointer;
  filter: brightness(0);
  opacity: 0.8;
  transition: opacity 0.2s ease;
  padding: 2px;
}

.bottom-container {
  margin-top: auto;
}

.input-wrapper {
  padding: 0 20px;
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

.nav-icon:hover,
.send-icon:hover,
.close-icon:hover {
  opacity: 0.8;
}

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
