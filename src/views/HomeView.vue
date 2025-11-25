<template>
  <AboutUsContent />
</template>

<script setup>
import AboutUsContent from '@/components/AboutUsContent.vue'
</script>

<style scoped>
.HomeView {
  background-image: url('@/assets/home-bg.jpg'); /* Color de fondo claro */
  background-size: cover;
  background-position: center;
  width: 100%;
  min-height: 100vh; /* Asegura que ocupe toda la altura de la ventana */
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
