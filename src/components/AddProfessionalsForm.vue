<template>
<v-card class="pa-8" elevation="6" rounded="lg">
        <v-card-title class="text-h5 font-weight-bold text-center mb-4">
          Registro de Profesional Médico
        </v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="isValid" lazy-validation>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.firstName"
                  label="Nombre"
                  prepend-inner-icon="mdi-account"
                  :rules="[rules.required]"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.lastName"
                  label="Apellidos"
                  prepend-inner-icon="mdi-account-details"
                  :rules="[rules.required]"
                  variant="outlined"
                />
              </v-col>
            </v-row>
            <v-select
              v-model="form.profession"
              label="Profesión"
              prepend-inner-icon="mdi-briefcase"
              :items="professions"
              :rules="[rules.required]"
              variant="outlined"
              class="mt-2"
            />
            <v-text-field
              v-model="form.specialty"
              label="Especialidad (opcional)"
              prepend-inner-icon="mdi-stethoscope"
              variant="outlined"
              class="mt-2"
            />
            <v-text-field
              v-model="form.email"
              label="Correo electrónico"
              prepend-inner-icon="mdi-email"
              :rules="[rules.required, rules.email]"
              variant="outlined"
              class="mt-2"
            />
            <v-text-field
              v-model="form.license"
              label="Número Colegiado (opcional)"
              prepend-inner-icon="mdi-card-account-details"
              variant="outlined"
              class="mt-2"
            />
            <v-btn
              block
              color="primary"
              class="mt-6"
              size="large"
              @click="submitForm"
            >
              Registrar Profesional
            </v-btn>
          </v-form>
        </v-card-text>
      </v-card>
   
 </template>

<script setup>

import { ref, reactive } from 'vue';
import professions from "@/assets/data/professions.json";

const professionsList = ref(professions.professions.map(p => p.profession));
const specialtyList = ref(...professions.professions.flatMap(p => p.speciality.map(s => s['speciality-name'])))


</script>