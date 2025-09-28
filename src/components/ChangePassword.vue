<template>
  <div>

    <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
      <v-text-field
        v-model="currentPassword"
        :label="$t('views.profile.changePassword.currentPassword')"
        type="password"
        prepend-inner-icon="mdi-lock"
        :rules="currentPasswordRules"
        :error-messages="errors.currentPassword"
        variant="outlined"
        class="mb-3"
        required
      />
      
      <v-text-field
        v-model="newPassword"
        :label="$t('views.profile.changePassword.newPassword')"
        type="password"
        prepend-inner-icon="mdi-lock-plus"
        :rules="newPasswordRules"
        :error-messages="errors.newPassword"
        variant="outlined"
        class="mb-3"
        required
      />
      
      <v-text-field
        v-model="confirmPassword"
        :label="$t('views.profile.changePassword.confirmPassword')"
        type="password"
        prepend-inner-icon="mdi-lock-check"
        :rules="confirmPasswordRules"
        variant="outlined"
        class="mb-4"
        required
      />
     
      
      <v-btn
        type="submit"
        color="primary"
        :loading="loading"
        :disabled="!valid || loading"
        block
        size="large"
      >
        {{ $t('views.profile.changePassword.actions.change') }}
      </v-btn> 
      
      <AlertMessage 
      :show="!!alertMessage" 
      :type="alertType" 
      :message="alertMessage" 
    />
    </v-form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { post } from '@/services/api.js'
import AlertMessage from '@/components/AlertMessage.vue'

const { t: $t } = useI18n()
const router = useRouter()

// Reactive data
const valid = ref(false)
const loading = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const form = ref(null)

// Alert system
const alertMessage = ref('')
const alertType = ref('success')

const errors = reactive({
  currentPassword: [],
  newPassword: []
})

// Validation rules
const currentPasswordRules = [
  v => !!v || $t('views.profile.changePassword.messages.currentPasswordRequired')
]

const newPasswordRules = [
  v => !!v || $t('views.profile.changePassword.messages.newPasswordRequired'),
  v => (v && v.length >= 6) || $t('views.profile.changePassword.messages.passwordMinLength')
]

const confirmPasswordRules = [
  v => !!v || $t('views.profile.changePassword.messages.confirmPasswordRequired'),
  v => v === newPassword.value || $t('views.profile.changePassword.messages.passwordsNotMatch')
]

// Clear alert
const clearAlert = () => {
  alertMessage.value = ''
}

// Clear messages and errors
const clearMessages = () => {
  clearAlert()
  errors.currentPassword = []
  errors.newPassword = []
}

// Handle form submission
const handleSubmit = async () => {
  if (!valid.value) return
  
  clearMessages()
  loading.value = true
  
  try {
    const response = await post('/change-password', {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    })

    // Handle success - using messageCode from backend
    alertType.value = 'success'
    alertMessage.value = response.messageCode || $t('views.profile.changePassword.messages.passwordChanged')

    // Reset form
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    form.value?.reset()
    
    // Redirect after success
    setTimeout(() => {
      router.push('/profile')
    }, 2000)
    
  } catch (error) {
    console.error('Error changing password:', error)
    
    // Handle validation errors from backend
    if (error.details && Array.isArray(error.details)) {
      error.details.forEach(err => {
        if (err.field === 'currentPassword') {
          errors.currentPassword.push($t('views.profile.changePassword.messages.currentPasswordRequired'))
        } else if (err.field === 'newPassword') {
          if (err.code === 'NAME_MIN_LENGTH') {
            errors.newPassword.push($t('views.profile.changePassword.messages.passwordMinLength'))
          } else {
            errors.newPassword.push($t('views.profile.changePassword.messages.newPasswordRequired'))
          }
        }
      })
    } else {
      // Handle general errors using messageCode from api service
      alertType.value = 'error'
      alertMessage.value = error.messageCode || 'INTERNAL_SERVER_ERROR'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}
</style>