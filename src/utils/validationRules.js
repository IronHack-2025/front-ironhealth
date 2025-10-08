const required = (message) => (value) => !!value || message
const email = (requiredMsg, invalidMsg) => (value) => {
  if (!value) return requiredMsg
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return pattern.test(value) || invalidMsg
}
const phone = (requiredMsg, invalidMsg) => (value) => {
  if (!value) return requiredMsg
  const pattern = /^\+?\d{7,15}$/
  return pattern.test(value) || invalidMsg
}
const dni = (requiredMsg, invalidMsg) => (value) => {
  if (!value) return requiredMsg
  const validPatterns = [/^[0-9]{8}[A-Z]$/i, /^[XYZ][0-9]{7}[A-Z]$/i]
  return validPatterns.some((pattern) => pattern.test(value)) || invalidMsg
}
const password =
  (requiredMsg, lengthMsg, min = 6) =>
  (value) => {
    if (!value) return requiredMsg
    return value.length >= min || lengthMsg
  }
const currentPassword = password
const newPassword = password
const confirmPassword = (requiredMsg, mismatchMsg) => (value, password) => {
  if (!value) return requiredMsg
  return value === password || mismatchMsg
}
const acceptedLength = (min, max, message) => (value) => {
  if (!value) return true
  return (value.length >= min && value.length <= max) || message
}

export default {
  required,
  email,
  phone,
  dni,
  password,
  currentPassword,
  newPassword,
  confirmPassword,
  acceptedLength,
}

// Helper para generar todas las reglas con mensajes traducidos
export function buildRules(t) {
  return {
    required: required(t('messages.validation.FORM_FIELDS_REQUIRED')),
    email: email(
      t('messages.validation.FORM_FIELDS_REQUIRED'),
      t('messages.validation.EMAIL_INVALID_FORMAT'),
    ),
    phone: phone(
      t('messages.validation.FORM_FIELDS_REQUIRED'),
      t('messages.validation.PHONE_INVALID_FORMAT'),
    ),
    dni: dni(
      t('messages.validation.FORM_FIELDS_REQUIRED'),
      t('messages.validation.DNI_INVALID_FORMAT'),
    ),
    password: password(
      t('messages.validation.FORM_FIELDS_REQUIRED'),
      t('messages.validation.PASSWORD_LENGTH'),
      6,
    ),
    currentPassword: password(
      t('messages.validation.FORM_FIELDS_REQUIRED'),
      t('messages.validation.PASSWORD_LENGTH'),
      6,
    ),
    newPassword: password(
      t('messages.validation.FORM_FIELDS_REQUIRED'),
      t('messages.validation.PASSWORD_LENGTH'),
      6,
    ),
    confirmPassword: confirmPassword(
      t('messages.validation.FORM_FIELDS_REQUIRED'),
      t('messages.validation.PASSWORDS_DO_NOT_MATCH'),
    ),
    acceptedLength: acceptedLength(
      3,
      50,
      t('messages.validation.ACCEPTED_LENGTH', { min: 3, max: 50 }),
    ),
  }
}
