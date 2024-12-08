<script setup lang="ts">
import { ref, reactive } from "vue";

const isVisible = ref(false);

const show = () => {
  isVisible.value = true;
};

const hide = () => {
  isVisible.value = false;
  // Reset all expanded states when closing
  helpItems.forEach((item) => (item.isExpanded = false));
};

interface HelpItem {
  id: number;
  question: string;
  answer: string;
  isExpanded: boolean;
  isHovered: boolean;
}

const helpItems = reactive<HelpItem[]>([
  {
    id: 1,
    question: "Who is TeacherAIde?",
    answer:
      "TeacherAIde is a helpful Generative AI assistant designed to support teachers in generating their teaching materials.",
    isExpanded: false,
    isHovered: false,
  },
  {
    id: 2,
    question: "How to copy the assistant response?",
    answer:
      "Click the copy icon (clipboard symbol) below any assistant response to copy the content.",
    isExpanded: false,
    isHovered: false,
  },
  {
    id: 3,
    question: "How to insert the assistant response to the tinyMCE editor?",
    answer:
      "Click the share icon below any assistant response to insert it directly into the tinyMCE editor.",
    isExpanded: false,
    isHovered: false,
  },
  {
    id: 4,
    question: "How to retrieve chat history?",
    answer:
      "Click the list icon at the bottom left corner of the screen to view your chat history.",
    isExpanded: false,
    isHovered: false,
  },
  {
    id: 5,
    question: "How to search, edit or delete chat history?",
    answer:
      "In the chat history screen, you can search for your chat with the search box, hover on any chat session and click the pencil icon on the top right corner to edit that session name or click the bin icon to delete that session from the chat history. You can click on any chat session to resume that chat session.",
    isExpanded: false,
    isHovered: false,
  },
]);

const toggleItem = (item: HelpItem) => {
  item.isExpanded = !item.isExpanded;
};

defineExpose({ show, hide });
</script>

<template>
  <div v-if="isVisible" class="help-overlay">
    <div class="help-modal">
      <div class="help-header">
        <h2 class="help-title">TeacherAIde</h2>
        <div class="help-subtitle">Help</div>
        <img @click="hide" src="../assets/close_icon.svg" alt="close" class="help-close" />
      </div>

      <div class="help-content">
        <div
          v-for="item in helpItems"
          :key="item.id"
          class="help-item"
          :class="{
            active: item.isHovered,
            expanded: item.isExpanded,
          }"
          @mouseenter="item.isHovered = true"
          @mouseleave="item.isHovered = false"
          @click="toggleItem(item)"
        >
          <div class="help-question">{{ item.id }}. {{ item.question }}</div>
          <div v-if="item.isExpanded" class="help-answer">
            {{ item.answer }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.help-overlay {
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

.help-modal {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.help-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
}

.help-title {
  color: #003274;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.help-subtitle {
  color: #93a3bc;
  font-size: 18px;
  margin-top: 4px;
}

.help-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 15px;
  height: 15px;
  cursor: pointer;
}

.help-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.help-item {
  background-color: #e7eef7;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.help-item.active {
  background-color: #b8cce8;
}

.help-item.expanded {
  background-color: #b8cce8;
}

.help-question {
  font-size: 16px;
  color: #003274;
  font-weight: 500;
}

.help-answer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 50, 116, 0.1);
  color: #4a5568;
  font-size: 14px;
  line-height: 1.4;
}

/* Hover effects */
.help-close:hover {
  opacity: 0.8;
}
</style>
