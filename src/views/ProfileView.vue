<template>
  <v-container class="pa-4">
    <v-row>
      <v-col cols="12">
        <v-card class="elevation-4">
          <v-card-title class="text-h4 text-center pa-6">
            {{ $t('navbar.profile') }}
          </v-card-title>

          <v-card-text>
            <v-row>
              <!-- Información del Usuario -->
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="mb-4">
                  <v-card-title class="text-h6">
                    {{ $t('views.profile.userInfo.title') }}
                  </v-card-title>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item v-if="user?.firstName">
                        <template v-slot:prepend>
                          <v-icon color="primary">mdi-account</v-icon>
                        </template>
                        <v-list-item-title
                          >{{ $t('common.forms.firstName') }}:
                          {{ user.firstName }}</v-list-item-title
                        >
                      </v-list-item>

                      <v-list-item v-if="user?.lastName">
                        <template v-slot:prepend>
                          <v-icon color="primary">mdi-account</v-icon>
                        </template>
                        <v-list-item-title
                          >{{ $t('common.forms.lastName') }}: {{ user.lastName }}</v-list-item-title
                        >
                      </v-list-item>

                      <v-list-item v-if="user?.email">
                        <template v-slot:prepend>
                          <v-icon color="primary">mdi-email</v-icon>
                        </template>
                        <v-list-item-title
                          >{{ $t('common.forms.email') }}: {{ user.email }}</v-list-item-title
                        >
                      </v-list-item>

                      <v-list-item v-if="user?.role">
                        <template v-slot:prepend>
                          <v-icon color="primary">mdi-badge-account</v-icon>
                        </template>
                        <v-list-item-title
                          >{{ $t('views.profile.userInfo.role') }}:
                          {{ user.role }}</v-list-item-title
                        >
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Cambio de Contraseña -->
              <v-col cols="12" md="6">
                <v-card variant="outlined">
                  <v-card-title class="text-h6">
                    {{ $t('views.profile.changePassword.title') }}
                  </v-card-title>
                  <v-card-text>
                    <ChangePassword />
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import ChangePassword from '@/components/ChangePassword.vue'

const { t: $t } = useI18n()
const { user } = useAuth()
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}
</style>
