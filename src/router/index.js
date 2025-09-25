import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Patients from '../views/PatientsView.vue'
import Professionals from '../views/ProfessionalsView.vue'
import Appointments from '../views/AppointmentsView.vue'
import Login from '../views/LoginView.vue'

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
    {
      path: '/appointments',
      name: 'appointments',
      component: Appointments,
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    }
  ],
})

export default router
