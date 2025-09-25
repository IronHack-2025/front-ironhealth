<script setup>
import { ref, watch } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SelectLanguage from '@/components/SelectLanguage.vue'

const { locale } = useI18n()
const router = useRouter()
const currentLocale = ref(locale.value)

// Sincronizar cambios de idioma entre i18n y currentLocale
watch(() => locale.value, (newLocale) => {
  currentLocale.value = newLocale
})

watch(currentLocale, (newLocale) => {
  locale.value = newLocale
  localStorage.setItem('lang', newLocale) // Persistir preferencia de idioma
})
const logout = async () => {
  try {
    // 1. Obtener el token de autenticación (ajusta según tu implementación)
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    
    // 2. Llamar al endpoint de logout del backend si hay token
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      }).catch((error) => {
        console.warn('Error calling logout endpoint:', error);
        // Continuar con el logout local aunque falle el backend
      });
    }
    
    // 3. Limpiar almacenamiento local
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // Si guardas datos del usuario
    
    // 4. Limpiar cookies si las usas
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
   
    // 5. Redirigir a login
    router.push('/login');
    
  } catch (error) {
    console.error('Error during logout:', error);
    
    // Aún así hacer logout local en caso de error
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }
};
</script>

<template>
  <header>
    <v-app>
      <v-navigation-drawer app permanent theme="dark">
        <v-list-item title="IronHealth" subtitle="CRM"></v-list-item>
        <v-divider />
        <v-list>
          <v-list-item to="/login" prepend-icon="mdi-login" :title="$t('navbar.login')"></v-list-item>
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
          <v-list-item @click="logout" prepend-icon="mdi-logout" :title="$t('navbar.logout')"></v-list-item>
        </v-list>
      </v-navigation-drawer>

      <v-main>
         <v-app-bar
  app
  density="compact"
  flat
  theme="dark"
>
  <v-spacer />
  <SelectLanguage v-model="currentLocale"/>

  <v-btn prepend-icon="mdi-account" to="/profile" text>
    
  </v-btn>

</v-app-bar>
        <RouterView :calendar-locale="currentLocale" />
      </v-main>
    </v-app>
  </header>
</template>
