<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4" offset-lg="4" offset-md="1">
        <v-card class="pa-6" elevation="8">
          <v-card-title class="text-center mb-4">
            <v-icon size="48" color="primary" class="mb-2">mdi-medical-bag</v-icon>
         
            <h3 class="font-weight-light">{{ $t('views.login.subtitle') }}</h3>
          </v-card-title>

          <v-form @submit.prevent="handleLogin" ref="loginForm" v-model="valid">
            <v-text-field
              v-model="form.email"
              :label="$t('views.login.email')"
              :rules="emailRules"
              type="email"
              prepend-inner-icon="mdi-email"
              outlined
              required
              class="mb-3"
            />

            <v-text-field
              v-model="form.password"
              :label="$t('views.login.password')"
              :rules="passwordRules"
              :type="showPassword ? 'text' : 'password'"
              prepend-inner-icon="mdi-lock"
              :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append-inner="showPassword = !showPassword"
              outlined
              required
              class="mb-4"
            />

            <v-btn
              type="submit"
              color="primary"
              block
              size="large"
              :loading="loading"
              :disabled="!valid || loading"
              class="mb-3"
            >
              {{ $t('views.login.actions.login') }}
            </v-btn>
          </v-form>

          <AlertMessage
            :show="alert.show"
            :type="alert.type"
            :message="alert.message"
            @close="resetAlert"
          />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
import AlertMessage from './AlertMessage.vue'

const { t } = useI18n()
const router = useRouter()
const { login, loading, clearLoginError } = useAuth()

const valid = ref(false)
const showPassword = ref(false)

const form = reactive({
  email: '',
  password: '',
})

const alert = reactive({
  show: false,
  message: '',
  type: 'success',
})

// Validation rules
const emailRules = [
  (v) => !!v || t('messages.validation.FORM_FIELDS_REQUIRED'),
  (v) => /.+@.+\..+/.test(v) || t('messages.validation.EMAIL_INVALID_FORMAT'),
]

const passwordRules = [
  (v) => !!v || t('messages.validation.FORM_FIELDS_REQUIRED'),
  (v) => (v && v.length >= 6) || t('messages.validation.PASSWORD_LENGTH'),
]

const resetAlert = () => {
  alert.show = false
  alert.message = ''
  alert.type = 'success'
  clearLoginError()
}

const handleLogin = async () => {
  if (!valid.value) return

  resetAlert()

  try {
    const result = await login({
      email: form.email,
      password: form.password,
    })

    if (result.success) {
      alert.show = true
      alert.type = 'success'
      alert.message = t('messages.success.LOGIN_SUCCESS')

      setTimeout(() => {
        router.push('/appointments')
      }, 1000)
    } else {
      alert.show = true
      alert.type = 'error'
      alert.message = t(`messages.error.${result.error}`)
    }
  } catch (error) {
    console.error('Unexpected error in handleLogin:', error)
    alert.show = true
    alert.type = 'error'
    alert.message = t('messages.error.LOGIN_FAILED')
  }
}
</script>

<style scoped>
.v-card {
  border-radius: 16px !important;
}

.v-card-title h2 {
  font-weight: 300;
  color: #2c3e50;
}
</style>
