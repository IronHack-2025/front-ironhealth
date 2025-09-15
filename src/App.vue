<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <header>
    <v-app>
      <v-navigation-drawer app permanent theme="dark">
        <v-list-item title="IronHealth" subtitle="CRM"></v-list-item>
        <v-divider />
        <v-list>
          <v-list-item
            to="/patients"
            prepend-icon="mdi-account-multiple"
            title="Patients"
          ></v-list-item>
          <v-list-item
            to="/professionals"
            prepend-icon="mdi-doctor"
            title="Professionals"
          ></v-list-item>
          <v-list-item to="/appointments" prepend-icon="mdi-calendar-blank" title="Appointments"></v-list-item>
        </v-list>
      </v-navigation-drawer>

      <v-main>
        <RouterView />
      </v-main>
    </v-app>
  </header>
</template>
