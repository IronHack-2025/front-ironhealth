<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="pa-8 text-center" elevation="12" rounded="xl">
          <!-- Icon and Status Code -->
          <v-avatar size="120" color="error" class="mb-6 mx-auto">
            <v-icon size="80" color="white">mdi-shield-lock</v-icon>
          </v-avatar>
          
          <!-- Error Code -->
          <div class="text-h2 font-weight-bold text-error mb-2">403</div>
          
          <!-- Title -->
          <v-card-title class="text-h4 font-weight-bold text-center mb-4 pa-0">
            {{ $t('views.forbidden.title') }}
          </v-card-title>
          
          <!-- Subtitle -->
          <v-card-subtitle class="text-h6 text-center mb-4 pa-0">
            {{ $t('views.forbidden.subtitle') }}
          </v-card-subtitle>
          
          <!-- Description -->
          <v-card-text class="text-body-1 text-medium-emphasis mb-6">
            {{ $t('views.forbidden.description') }}
          </v-card-text>
          
          <!-- User Role Info -->
          <v-card-text v-if="userRole" class="pa-0 mb-4">
            <v-chip 
              :color="getRoleColor(userRole)" 
              variant="outlined" 
              size="large"
              prepend-icon="mdi-account"
            >
              {{ $t(`views.users.roles.${userRole}`) }}
            </v-chip>
          </v-card-text>
          
          <!-- Action Buttons -->
          <v-card-actions class="justify-center pa-0">
            <v-btn
              color="primary"
              variant="elevated"
              size="large"
              prepend-icon="mdi-arrow-left"
              class="me-4"
              @click="goBack"
            >
              {{ $t('views.forbidden.goBack') }}
            </v-btn>
            
            <v-btn
              color="secondary" 
              variant="outlined"
              size="large"
              prepend-icon="mdi-calendar-check"
              @click="goMyAppointments"
            >
              {{ $t('views.forbidden.goMyAppointments') }}
            </v-btn>
          </v-card-actions>
          <v-card-text>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuth } from '@/composables/useAuth.js';

const { t } = useI18n();
const router = useRouter();
const { user } = useAuth();

// Computed para obtener el rol del usuario
const userRole = computed(() => {
  return user.value?.role || null;
});

// Función para obtener el color del rol
const getRoleColor = (role) => {
  const colors = {
    admin: 'purple',
    professional: 'blue', 
    patient: 'green'
  };
  return colors[role] || 'grey';
};

// Función para volver a la página anterior
const goBack = () => {
  // Si hay historial, volver atrás, sino ir a home
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    goHome();
  }
};

// Función para ir a la página principal
const goMyAppointments = () => {
  router.push('/my-appointments');
};

</script>

<style scoped>
.fill-height {
  min-height: calc(100vh - 64px); /* Ajustar según la altura de tu navbar */
}

.text-medium-emphasis {
  color: rgba(0, 0, 0, 0.6) !important;
}

/* Animaciones */
.v-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-avatar {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.v-btn {
  transition: all 0.3s ease;
}

.v-btn:hover {
  transform: translateY(-2px);
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .v-card {
    margin: 16px;
  }
  
  .v-avatar {
    width: 80px !important;
    height: 80px !important;
  }
  
  .v-avatar .v-icon {
    font-size: 50px !important;
  }
  
  .text-h2 {
    font-size: 3rem !important;
  }
  
  .text-h4 {
    font-size: 1.75rem !important;
  }
}
</style>
