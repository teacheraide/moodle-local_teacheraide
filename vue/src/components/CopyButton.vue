<template>
    <div class="text-center" v-if="text">
      <button
        @click="copyText"
        class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        Copy Last Response
      </button>
    </div>
  </template>
  
  <script setup lang="ts">
  // Props are used to pass the text from the parent component
  const props = defineProps<{ text: string }>();
  
  // Function to copy the provided text to the clipboard
  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(props.text);
      alert("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };
  </script>
  
  <style scoped>
  /* You can add styles specific to your copy button here */
  </style>
  