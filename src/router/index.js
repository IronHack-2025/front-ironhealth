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
      //meta: { requiresAuth: true, roles: ['admin', 'professional'] }
    },
    {
      path: '/professionals',
      name: 'professionals',
      component: Professionals,
      //meta: { requiresAuth: true }
    },
    {
      path: '/appointments',
      name: 'appointments',
      component: Appointments,
      //meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    }
  ],
})

// Guard de autenticación
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('authToken')
  const userRole = localStorage.getItem('userRole') // Asume que guardas el rol
  
  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }
  
  if (to.meta.roles && !to.meta.roles.includes(userRole)) {
    // Redirigir a página de "sin permisos" o dashboard
    next('/appointments')
    return
  }
  
  next()
})

export default router
