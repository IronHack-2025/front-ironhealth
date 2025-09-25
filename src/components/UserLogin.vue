<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="pa-6" elevation="8">
          <v-card-title class="text-center mb-4">
            <v-icon size="48" color="primary" class="mb-2">mdi-medical-bag</v-icon>
            <h2>{{ $t('views.login.title') }}</h2>
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

          <Alert 
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
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { post } from '@/services/api'
import Alert from './AlertMessage.vue'

const { t } = useI18n()
const router = useRouter()

const valid = ref(false)
const loading = ref(false)
const showPassword = ref(false)
const showForgotPassword = ref(false)
const resetEmail = ref('')
const loginForm = ref(null)

const form = reactive({
  email: '',
  password: ''
})

const alert = reactive({
  show: false,
  message: '',
  type: 'success'
})

// Validation rules
const emailRules = [
  v => !!v || t('validation.required'),
  v => /.+@.+\..+/.test(v) || t('validation.emailFormat')
]

const passwordRules = [
  v => !!v || t('validation.required'),
  v => (v && v.length >= 6) || t('validation.passwordLength')
]

const resetAlert = () => {
  alert.show = false
  alert.message = ''
  alert.type = 'success'
}

const handleLogin = async () => {
  if (!valid.value) return

  loading.value = true
  resetAlert()

  try {
    const response = await post('/auth/login', {
      email: form.email,
      password: form.password
    })

    console.log('Login response:', response); // Debug

    // Acceder correctamente a los datos
    const { data } = response; // response.data contiene { token, user }
    
    // Store token if provided
    if (data.token) {
      localStorage.setItem('authToken', data.token)
    }

    if (data.user) {
      localStorage.setItem('userId', data.user.id)
      localStorage.setItem('userRole', data.user.role)
      
      // Opcional: guardar más datos del usuario
      if (data.user.profileId) {
        localStorage.setItem('profileId', data.user.profileId)
      }
      if (data.user.mustChangePassword) {
        localStorage.setItem('mustChangePassword', data.user.mustChangePassword)
      }
    }

    alert.show = true
    alert.type = 'success'
    alert.message = t('messages.success.LOGIN_SUCCESS')
    
    // Redirect after successful login
    setTimeout(() => {
      router.push('/appointments')
    }, 1500)

  } catch (error) {
    console.error('Login error:', error)
    
    alert.show = true
    alert.type = 'error'
    alert.message = t(`messages.error.${error.messageCode || 'LOGIN_FAILED'}`)
  } finally {
    loading.value = false
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