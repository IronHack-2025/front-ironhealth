<template>
  <v-alert v-if="show" :type="type" variant="tonal" border="start" prominent class="mt-4">
    {{ message }}
  </v-alert>
</template>

<script setup>
defineProps({
  show: Boolean,
  type: {
    type: String,
    default: 'success', // 'success' or 'error'
  },
  message: {
    type: String,
    default: '',
  },
})
</script>
