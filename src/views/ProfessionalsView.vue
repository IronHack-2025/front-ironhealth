<template>
  <div class="container">
    <div class="left">
    <AddProfessionalsForm/>
    </div>
    <div class="rigth">
    <ProfessionalsList/>
    </div>

  </div>
</template>




<script setup>
import ProfessionalsList from '@/components/ProfessionalsList.vue';
import AddProfessionalsForm from '@/components/AddProfessionalsForm.vue'
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