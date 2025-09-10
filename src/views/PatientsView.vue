

<template>
  <div class="container">
    <div class="left">
<AddPatient @patient-added="handlePatientAdded" />
    </div>
    <div class="rigth">
    <PatientsList :key="refreshList"/>
    </div>

  </div>
</template>


<script setup>
import { ref } from 'vue'
import PatientsList from '@/components/PatientsList.vue';
import AddPatient from '@/components/AddPatient.vue';

const refreshList = ref(0)

const handlePatientAdded = () => {
  refreshList.value++ //Forzamos un cambio en la variable reactiva para destruir y volver a crear el componente
}
</script>


<!-- <style scoped>
.container{
  display: grid;
  grid-template-columns: 1fr 1fr;

}

.left .right {
  padding: 20px;
  overflow-y: auto
}

</style> -->