<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div class="flex flex-col items-center gap-6">
    <h1 class="text-4xl font-bold text-gray-800">frontend-vota</h1>
    <p class="text-gray-500">Client-side Vue 3 + Vite + Tailwind CSS</p>

    <button
      class="rounded-lg bg-purple-600 px-6 py-2 text-white font-medium hover:bg-purple-700 transition"
      @click="count++"
    >
      Count is {{ count }}
    </button>
  </div>
</template>