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
            :title="$t('navbar.patients')"
          ></v-list-item>
          <v-list-item
            to="/professionals"
            prepend-icon="mdi-doctor"
            :title="$t('navbar.professionals')"
          ></v-list-item>
          <v-list-item to="/appointments" prepend-icon="mdi-calendar-blank" :title="$t('navbar.appointments')">

          </v-list-item>
        </v-list>
      </v-navigation-drawer>

      <v-main>
        <RouterView />
      </v-main>
    </v-app>
  </header>
</template>
