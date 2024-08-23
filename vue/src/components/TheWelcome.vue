<script setup lang="ts">
import WelcomeItem from './WelcomeItem.vue'
import DocumentationIcon from './icons/IconDocumentation.vue'
// import ToolingIcon from './icons/IconTooling.vue'
// import EcosystemIcon from './icons/IconEcosystem.vue'
// import CommunityIcon from './icons/IconCommunity.vue'
// import SupportIcon from './icons/IconSupport.vue'
// import HelloWorldButton from './HelloWorldButton'
import { defineProps } from 'vue'
defineProps<{
  msg: string
}>()

function handleClick() {
  alert('Hello world!')
}
</script>

<template>
  <div data-theme="light" class="bg-white p-2 shadow">
    <WelcomeItem>
      <h1 class="text-3xl font-bold">Hello world!</h1>
      <button class="btn btn-primary" @click="handleClick">
        <DocumentationIcon />
        {{ msg }}
      </button>
    </WelcomeItem>
  </div>
</template>

<style scoped>
@import '../assets/main.css';
</style>
