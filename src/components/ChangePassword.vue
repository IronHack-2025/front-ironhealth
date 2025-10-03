<template>
  <div>
    <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
      <v-text-field
        v-model="currentPassword"
        :label="$t('views.profile.changePassword.currentPassword')"
        type="password"
        prepend-inner-icon="mdi-lock"
        :rules="[rules.currentPassword(currentPassword)]"
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
        :rules="[rules.newPassword(newPassword)]"
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
        :rules="[rules.confirmPassword(confirmPassword, newPassword)]"
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
        :show="alertMessage.show"
        :type="alertMessage.type"
        :message-code="alertMessage.messageCode"
        :details="alertMessage.details"
        :message-params="alertMessage.params"
        :fallback-message="alertMessage.message"
      />
    </v-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { post } from '@/services/api.js'
import AlertMessage from '@/components/AlertMessage.vue'
import { buildRules } from '@/utils/rules.js'

const { t, locale } = useI18n()
const rules = computed(() => buildRules(t))

watch(locale, () => {
  if (form.value) {
    form.value.validate()
  }
})
const router = useRouter()

// Reactive data
const valid = ref(false)
const loading = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const form = ref(null)

const alertMessage = reactive({
  show: false,
  message: '',
  type: 'success',
  messageCode: 'OPERATION_SUCCESS',
  details: null,
  params: {},
})

const errors = reactive({
  currentPassword: [],
  newPassword: [],
  confirmPassword: [],
})

// Clear alertMessage
const clearAlert = () => {
  alertMessage.show = false
  alertMessage.message = ''
  alertMessage.details = null
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
    const response = await post('/auth/change-password', {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })

    alertMessage.show = true
    alertMessage.type = response.messageType || 'success'
    alertMessage.messageCode = response.messageCode || 'OPERATION_SUCCESS'
    alertMessage.details = Array.isArray(response.details) ? response.details : undefined
    alertMessage.params = response.params || {}
    alertMessage.message = $t(`messages.success.${response.messageCode}`)

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

    // ✅ Manejar errores específicos de campo si existen
    if (error.details && Array.isArray(error.details)) {
      error.details.forEach((err) => {
        if (err.field === 'currentPassword') {
          errors.currentPassword.push(
            $t('views.profile.changePassword.messages.invalidCurrentPassword'),
          )
        } else if (err.field === 'newPassword') {
          if (err.code === 'PASSWORD_MIN_LENGTH') {
            errors.newPassword.push($t('views.profile.changePassword.messages.passwordMinLength'))
          } else {
            errors.newPassword.push($t('views.profile.changePassword.messages.newPasswordRequired'))
          }
        }
      })
    }

    alertMessage.show = true
    alertMessage.type = error.messageType || 'error'
    alertMessage.messageCode = error.messageCode || 'INTERNAL_SERVER_ERROR'
    alertMessage.details = Array.isArray(error.details) ? error.details : undefined
    alertMessage.params = error.params || {}
    alertMessage.message = $t(`messages.error.${error.messageCode}`)
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
