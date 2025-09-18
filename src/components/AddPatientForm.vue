<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12">
        <v-card class="pa-8" elevation="6" rounded="xl">
          <v-card-title class="text-h5 font-weight-bold text-center mb-4">
            Registro de Pacientes
          </v-card-title>
          <v-card-text>
            <v-form ref="formRef" v-model="isValid" lazy-validation>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.firstName"
                    label="Nombre"
                    prepend-inner-icon="mdi-account"
                    :rules="[rules.required, rules.acceptedLength]"
                    variant="outlined"
                    maxlength="50"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.lastName"
                    label="Apellidos"
                    prepend-inner-icon="mdi-account-details"
                    :rules="[rules.required, rules.acceptedLength]"
                    variant="outlined"
                    maxlength="50"
                  />
                </v-col>
              </v-row>
              <v-text-field
                v-model="form.email"
                label="Correo electrónico"
                prepend-inner-icon="mdi-email"
                :rules="[rules.required, rules.email]"
                variant="outlined"
                class="mt-2"
                maxlength="50"
              />

              <v-text-field
                v-model="form.phone"
                label="Número de teléfono"
                prepend-inner-icon="mdi-phone"
                :rules="[rules.required, rules.phone]"
                variant="outlined"
                class="mt-2"
                maxlength="9"
                 inputmode="numeric"
                
              />

              <v-date-input
                v-model="form.birthDate"
                label="Fecha de nacimiento"
                prepend-inner-icon="mdi-calendar-account-outline"
                prepend-icon=""
                :rules="[rules.required]"
                variant="outlined"
                class="mt-2"
              />
              <CloudinaryUpload
               ref="cloudinaryRef" 
                :preset="uploadPreset"
                folder="patients"
                buttonText="Subir foto del paciente"
                api-url="http://localhost:3000/api/signature"
                @uploaded="form.imageUrl = $event"
                @cleared="form.imageUrl = ''"
                block
              />
              <v-btn
                block
                color="primary"
                class="mt-6"
                size="large"
                @click="newPatient"
                cursor="pointer"
              >
                Registrar Paciente
              </v-btn>
            </v-form>
            <Alert :show="alert.show" :type="alert.type" :message="alert.message" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import Alert from './AlertMessage.vue'
const cloudinaryRef = ref(null)
const emit = defineEmits(['patient-added'])
import { post } from '../services/api'
import CloudinaryUpload from './CloudinaryUpload.vue'

const formRef = ref(null)
const isValid = ref(false)
// const dateActive = ref(false)
const rules = {
  required: (value) => !!value || 'Este campo es obligatorio',
  email: (value) => {
    if (!value) return 'Este campo es obligatorio'
    // Validación simple de email
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Correo electrónico inválido'
  },
  phone: (value) => {
    if (!value) return 'Este campo es obligatorio'
    const pattern = /^\+?\d{7,15}$/
    return pattern.test(value) || 'Número de teléfono inválido'
  },
  acceptedLength: (value) => {
    const lengthMax = 50
    const lengthMin = 3
    return (
      (value.length <= lengthMax && value.length >= lengthMin) ||
      `El campo debe tener entre ${lengthMin} y ${lengthMax} caracteres.`
    )
  },
}
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  birthDate: '',
  imageUrl: '',
})
const alert = reactive({
  show: false,
  message: '',
  type: 'success',
})
const newPatient = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    alert.show = true
    alert.type = 'error'
    alert.message = ' Revisa los campos del formulario'
    return
  }
  console.log(form.imageUrl)
  const formData = {
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email,
    phone: form.phone,
    birthDate: form.birthDate,
    imageUrl: form.imageUrl
,
  }
  try {
    await post('/patients', formData)
    formRef.value.reset()
    cloudinaryRef.value?.clearImage()
    emit('patient-added')
    alert.show = true
    alert.type = 'success'
    alert.message = 'Paciente registrado con éxito'
  } catch (error) {
    alert.show = true
    alert.type = 'error'
    alert.message = 'Error de conexion: ' + error.message
  }
}

onMounted(() => {
  if (!window.cloudinary) {
    const script = document.createElement('script')
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js'
    script.async = true
    script.onload = () => {
      initWidget()
    }
    document.head.appendChild(script)
  } else {
    initWidget()
  }
})

function initWidget() {
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  const myWidget = window.cloudinary.createUploadWidget(
    {
      cloudName: CLOUD_NAME,
      uploadPreset: UPLOAD_PRESET,
    },
    (error, result) => {
      if (!error && result && result.event === 'success') {
        imageUrl.value = result.info.secure_url
        form.imageUrl = result.info.secure_url // <-- Cambia aquí a imageUrl
        console.log('Imagen subida:', result.info)
      }
    },
  )
}

function openCloudinaryWidget() {
  if (myWidget) {
    myWidget.open()
  }
}
</script>
