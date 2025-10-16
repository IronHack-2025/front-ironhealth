<script setup>
import { ref, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth.js'
import SelectLanguage from '@/components/SelectLanguage.vue'
import ironhealthLogo from '@/assets/ironhealth-logo.png'

const drawer = ref(true)
const rail = ref(true)
const { locale } = useI18n()
const currentLocale = ref(locale.value)

// Usar el composable useAuth en lugar de computed locales
const { isAuthenticated, isAdmin, isProfessional, logout, initializeAuth } = useAuth()

// Inicializar autenticación al cargar la app
initializeAuth()

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
      <v-navigation-drawer app v-model="drawer" :rail="rail" permanent theme="dark">
        <v-list-item>
          <template v-slot:prepend>
            <v-avatar>
              <v-img :src="ironhealthLogo"></v-img>
            </v-avatar>
          </template>
          <v-list-item-title v-if="!rail"> IronHealth </v-list-item-title>
        </v-list-item>

        <div class="d-flex justify-end pa-2">
          <v-btn
            :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
            variant="text"
            @click.stop="rail = !rail"
            size="small"
            color="white"
          ></v-btn>
        </div>
        <v-divider />
        <v-list>
          <v-list-item
            to="/login"
            prepend-icon="mdi-login"
            :title="$t('navbar.login')"
            v-if="!isAuthenticated"
          ></v-list-item>
          <v-list-item
            to="/patients"
            prepend-icon="mdi-account-multiple"
            :title="$t('navbar.patients')"
            v-if="isAuthenticated && (isProfessional || isAdmin)"
          ></v-list-item>
          <v-list-item
            to="/professionals"
            prepend-icon="mdi-doctor"
            :title="$t('navbar.professionals')"
            v-if="isAuthenticated"
          ></v-list-item>
          <v-list-item
            to="/appointments"
            prepend-icon="mdi-calendar-blank"
            :title="$t('navbar.appointments')"
            v-if="isAuthenticated"
          ></v-list-item>
          <v-list-item
            to="/my-appointments"
            prepend-icon="mdi-calendar-check"
            :title="$t('navbar.myAppointments')"
            v-if="isAuthenticated && !isAdmin"
          ></v-list-item>
          <v-list-item
            to="/users"
            prepend-icon="mdi-account-group"
            :title="$t('navbar.users')"
            v-if="isAuthenticated && isAdmin"
          ></v-list-item>
          <v-list-item
            @click="logout"
            prepend-icon="mdi-logout"
            :title="$t('navbar.logout')"
            v-if="isAuthenticated"
          ></v-list-item>
        </v-list>
      </v-navigation-drawer>

      <v-main>
        <v-app-bar app density="compact" flat theme="dark">
          <v-spacer />
          <SelectLanguage v-model="currentLocale" />

          <v-btn prepend-icon="mdi-account" to="/profile" text> </v-btn>
        </v-app-bar>
        <RouterView :calendar-locale="currentLocale" />
      </v-main>
    </v-app>
  </header>
</template>
