<template>
  <v-container class="pa-6">
    <!-- pa-6  padding all -->
    <v-card class="pa-6" max-width="500" outlined>
      <v-card-title>📩 Suscríbete a nuestra newsletter</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="subscribe">
          <v-text-field
            v-model="email"
            label="Tu correo"
            type="email"
            required
          ></v-text-field>

          <v-btn type="submit" color="primary" class="mt-4">
            Suscribirse
          </v-btn>
        </v-form>

        <p v-if="message" class="mt-4">{{ message }}</p>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from "vue";

const email = ref("");
const message = ref("");

const subscribe = async () => {
  try {
    const res = await fetch("http://localhost:3000/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.value }),
    });

    const data = await res.json();
    message.value = data.message || data.error;
  } catch (err) {
    message.value = "❌ Error al conectar con el servidor";
  }
};
</script>
