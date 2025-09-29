<template>
  <div class="patient-search-container">
    <h2 class="text-h5 my-4">{{ $t('views.myAppointments.patientHistorySearch') }}</h2>
    <v-autocomplete
      ref="searchInput"
      v-model="selectedPatient"
      v-model:search="searchTerm"
      :items="filteredPatients"
      :loading="isLoading"
      :placeholder="$t('common.search.patients.placeholder')"
      :no-data-text="searchTerm.length < 2 ? '' : $t('common.search.patients.noResults')"
      item-title="fullName"
      item-value="id"
      return-object
      clearable
      outlined
      dense
      hide-details="auto"
      prepend-inner-icon="mdi-magnify"
      @update:model-value="handlePatientSelect"
      @click:clear="clearSelection"
      @keydown="handleKeydown"
    >
      <!-- Custom item template -->
      <template v-slot:item="{ props, item }">
        <v-list-item
          v-bind="props"
          :title="item.raw.fullName"
          :subtitle="item.raw.email"
          class="patient-list-item"
        >
          <template v-slot:prepend>
            <v-avatar color="primary" size="40">
              <span class="text-white text-body-2">{{ getPatientInitials(item.raw) }}</span>
            </v-avatar>
          </template>
        </v-list-item>
      </template>

      <!-- Loading template -->
      <template v-slot:loading>
        <v-list-item>
          <v-list-item-title>{{ $t('common.search.patients.loading') }}</v-list-item-title>
        </v-list-item>
      </template>
    </v-autocomplete>

    <!-- Paciente seleccionado -->
    <v-card v-if="selectedPatient && !searchTerm" class="mt-4" outlined>
      <v-card-text class="pa-3">
        <div class="d-flex align-center">
          <v-avatar color="primary" size="48" class="me-3">
            <span class="text-white font-weight-bold">{{ getPatientInitials(selectedPatient) }}</span>
          </v-avatar>
          <div class="flex-grow-1">
            <div class="text-h6 font-weight-medium">{{ getPatientName(selectedPatient) }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ selectedPatient.email }}</div>
          </div>
          <v-btn
            icon="mdi-close"
            size="small"
            variant="text"
            :title="$t('common.search.patients.clear')"
            @click="clearSelection"
          />
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { get } from '@/services/api.js';

const { t } = useI18n();

const emit = defineEmits(['patient-selected', 'patient-cleared', 'update:modelValue']);

const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  }
});

const searchTerm = ref('');
const patients = ref([]);
const selectedPatient = ref(props.modelValue);
const isLoading = ref(false);
const searchInput = ref(null);

// Función para obtener el nombre completo del paciente
const getPatientName = (patient) => {
  if (!patient) return '';
  
  const firstName = patient.firstName ||  '';
  const lastName = patient.lastName ||  '';
  
  return `${firstName} ${lastName}`.trim();
};

// Función para obtener las iniciales del paciente
const getPatientInitials = (patient) => {
  if (!patient) return '';
  
  const firstName = patient.firstName ||  '';
  const lastName = patient.lastName || '';
  
  const firstInitial = firstName.charAt(0).toUpperCase() || '';
  const lastInitial = lastName.charAt(0).toUpperCase() || '';
  
  return `${firstInitial}${lastInitial}`;
};

// Computed para preparar los pacientes con nombres completos para el autocomplete
const filteredPatients = computed(() => {
  if (searchTerm.value.length < 2) return [];
  
  const term = searchTerm.value.toLowerCase();
  
  return patients.value
    .filter(patient => {
      const firstName = (patient.firstName || patient.name || '').toLowerCase();
      const lastName = (patient.lastName || patient.surname || '').toLowerCase();
      const email = (patient.email || '').toLowerCase();
      
      return firstName.includes(term) || 
             lastName.includes(term) || 
             email.includes(term);
    })
    .map(patient => ({
      ...patient,
      id: patient._id || patient.id,
      fullName: getPatientName(patient)
    }))
    .slice(0, 8);
});

const loadPatients = async () => {
  try {
    isLoading.value = true;
    const response = await get('/patients');
    patients.value = response.data || [];
  } catch (error) {
    console.error(t('messages.error'), error);
  } finally {
    isLoading.value = false;
  }
};

const handlePatientSelect = (patient) => {
  if (patient) {
    selectedPatient.value = patient;
    emit('patient-selected', patient);
    emit('update:modelValue', patient);
  }
};

const clearSelection = () => {
  selectedPatient.value = null;
  searchTerm.value = '';
  emit('patient-cleared');
  emit('update:modelValue', null);
};

const handleKeydown = (event) => {
  // Manejar teclas especiales si es necesario
  if (event.key === 'Escape') {
    searchInput.value?.blur();
  }
};

// Watcher para sincronizar con v-model
watch(() => props.modelValue, (newValue) => {
  selectedPatient.value = newValue;
}, { immediate: true });

// Watcher para limpiar la búsqueda cuando se selecciona un paciente
watch(selectedPatient, (newValue) => {
  if (newValue) {
    // Limpiar el término de búsqueda cuando se selecciona un paciente
    searchTerm.value = '';
  }
});

onMounted(() => {
  loadPatients();
});
</script>

<style scoped>
.patient-search-container {
  width: 100%;
  align-self: center;
  justify-self: center;
}

.patient-list-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.patient-list-item:last-child {
  border-bottom: none;
}

/* Vuetify utility classes personalizadas si es necesario */
.text-medium-emphasis {
  color: rgba(0, 0, 0, 0.6) !important;
}
</style>