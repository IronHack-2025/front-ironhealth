<template>
  <div class="container">
    <div class="left">
<AddProfessionalsForm @professional-added="handleProfessionalAdded" />
    </div>
    <div class="rigth">
    <ProfessionalsList :key="refreshList"/>
    </div>

  </div>
</template>




<script setup>
import { ref } from 'vue'
import ProfessionalsList from '@/components/ProfessionalsList.vue';
import AddProfessionalsForm from '@/components/AddProfessionalsForm.vue'

const refreshList = ref(0)

const handleProfessionalAdded = () => {
  refreshList.value++
}
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