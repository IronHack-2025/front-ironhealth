import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Patients from '../views/PatientsView.vue'
import Professionals from '../views/ProfessionalsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/patients',
      name: 'patients',
      component: Patients,
    },
    {
      path: '/professionals',
      name: 'professionals',
      component: Professionals,
    },
  ],
})

export default router
