<script setup>
import { ref, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SelectLanguage from '@/components/SelectLanguage.vue'

const { locale } = useI18n()
const currentLocale = ref(locale.value)

// Sincronizar cambios de idioma entre i18n y currentLocale
watch(
  () => locale.value,
  (newLocale) => {
    currentLocale.value = newLocale
  },
)

watch(currentLocale, (newLocale) => {
  locale.value = newLocale
  localStorage.setItem('lang', newLocale) // Persistir preferencia de idioma
})
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
          <v-list-item
            to="/appointments"
            prepend-icon="mdi-calendar-blank"
            :title="$t('navbar.appointments')"
          >
          </v-list-item>
        </v-list>

        <SelectLanguage v-model="currentLocale" />
      </v-navigation-drawer>

      <v-main>
        <RouterView :calendar-locale="currentLocale" />
      </v-main>
    </v-app>
  </header>
</template>
