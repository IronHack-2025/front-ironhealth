<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { ref } from "vue";

// Tab Seleccionada
const currentView = ref("patients");

</script>

<template>
  <header>
      <v-app>

    <v-navigation-drawer app permanent color="primary">
      <v-list-item title="IronHealth" subtitle="CRM"></v-list-item>
      <v-divider />
      <v-list>
        <v-list-item
          link
          prepend-icon="mdi-account-multiple"
          title="Patients"
          @click="currentView = 'patients'"
        ></v-list-item>
        <v-list-item
          link
          prepend-icon="mdi-doctor"
          title="Proffesionals"
          @click="currentView = 'proffesionals'"
        ></v-list-item>

      </v-list>
    </v-navigation-drawer>

    <v-main v-if="currentView === 'patients'">
      <v-container fluid>
        <h1>Patients</h1>
      </v-container>
    </v-main>
    <v-main v-if="currentView === 'proffesionals'">
      <v-container fluid>
        <h1>DPoffesionals</h1>
      </v-container>
    </v-main>




      </v-app>

  </header>

</template>




<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
