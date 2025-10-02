<script setup lang="ts">
import UserLogin from '@/components/UserLogin.vue'
</script>

<template>
     <v-container class="LoginView" fluid>
   <UserLogin />
</v-container>
</template>
<style scoped>
.LoginView {
  background-image: url('@/assets/login-bg.jpg'); /* Color de fondo claro */
  background-size: cover;
  background-position: center;
  width: 100%;
  min-height: 100vh; /* Asegura que ocupe toda la altura de la ventana */
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
