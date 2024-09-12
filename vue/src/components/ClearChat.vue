<template>
  <!-- Only show the button when there are more messages than just the system message -->
  <div v-if="hasMessages" class="text-center">
    <button
      @click="clearChat"
      class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
    >
      Clear Chat
    </button>
  </div>
</template>

<script setup lang="ts">
// Define the emit function to emit events back to the parent component
const emit = defineEmits(["clearChat"]);

// Props to check if there are messages (excluding the system message)
const props = defineProps<{ hasMessages: boolean }>();

const clearChat = () => {
  emit("clearChat"); // Emit the 'clearChat' event to the parent
};
</script>

<style scoped>
/* Custom styles for the clear chat button can be added here */
</style>
