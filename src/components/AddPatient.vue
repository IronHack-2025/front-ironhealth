<template>
    <v-card class="pa-8" elevation="6" rounded="lg">
        <v-card-title class="text-h5 font-weight-bold text-center mb-4">
            Registro de Paciente
        </v-card-title>
        <v-card-text>
            <v-form ref="formRef" v-model="isValid" lazy-validation>
                <v-row>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.firstName" label="Nombre" prepend-inner-icon="mdi-account"
                            :rules="[rules.required]" variant="outlined" />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.lastName" label="Apellidos" prepend-inner-icon="mdi-account-details"
                            :rules="[rules.required]" variant="outlined" />
                    </v-col>
                </v-row>
                <v-text-field v-model="form.email" label="Correo electrónico" prepend-inner-icon="mdi-email"
                    :rules="[rules.required, rules.email]" variant="outlined" class="mt-2" />

                <v-text-field v-model="form.phone" label="Número de teléfono" prepend-inner-icon="mdi-phone"
                    :rules="[rules.required, rules.phone]" variant="outlined" class="mt-2" />

                <v-btn color="dark" class="mt-2" size="large" @click="dateActive = !dateActive" cursor="pointer">Fecha
                    de nacimiento</v-btn>

                <v-date-picker v-if="dateActive" v-model="form.birthDate" label="Fecha de nacimiento"
                    prepend-inner-icon="mdi-calendar-account-outline" :rules="[rules.required]" variant="outlined"
                    class="mt-2"></v-date-picker>

                <v-btn block color="primary" class="mt-6" size="large" @click="newPatient" cursor="pointer">
                    Registrar Paciente
                </v-btn>
            </v-form>

            <v-alert v-if="alert.show" :type="alert.type" variant="tonal" border="start" prominent class="mt-4">
                {{ alert.message }}
            </v-alert>

        </v-card-text>
    </v-card>
</template>

<script setup>

import { ref, reactive } from "vue";

const formRef = ref(null)
const isValid = ref(false)
const dateActive = ref(false)

const rules = {
    required: value => !!value || 'Este campo es obligatorio',
    email: value => {
        if (!value) return 'Este campo es obligatorio';
        // Validación simple de email
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(value) || 'Correo electrónico inválido';
    },
    phone: value => {
        if (!value) return 'Este campo es obligatorio';
        const pattern = /^\+?\d{7,15}$/;
        return pattern.test(value) || 'Número de teléfono inválido'
    }
};

const form = reactive({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: ''
});

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
        alert.message = " Revisa los campos del formulario"
        return
    }

    const formData = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        birthDate: form.birthDate
    }

    console.log(formData)

    try {
        const res = await fetch("http://localhost:3000/api/patients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });
        if (res.ok) {
            formRef.value.reset()
            alert.show = true
            alert.type = 'success'
            alert.message = 'Paciente registrado con éxito'


        } else {
            const errorData = await res.json()
            alert.show = true
            alert.type = 'error'
            alert.message = errorData.error
        }

    } catch (error) {
        alert.show = true
        alert.type = 'error'
        alert.message = "Error de conexión: " + error.message
    }

};


</script>
