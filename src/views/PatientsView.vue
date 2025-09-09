

<template>
  <div class="container">
    <div class="left">
    <AddPatient />
    </div>
    <div class="rigth">
    <PatientsList/>
    </div>

  </div>
</template>




<script setup>
import PatientsList from '@/components/PatientsList.vue';
import AddPatient from '@/components/AddPatient.vue';
</script>


<style scoped>
.container{
  display: grid;
  grid-template-columns: 1fr 1fr;

}

.left .right {
  padding: 20px;
  overflow-y: auto
}

</style>