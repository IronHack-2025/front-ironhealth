import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import HomeView from '../views/HomeView.vue'
import Patients from '../views/PatientsView.vue'
import Professionals from '../views/ProfessionalsView.vue'
import Appointments from '../views/AppointmentsView.vue'
import Login from '../views/LoginView.vue'
import MyAppointments from '../views/MyAppointmentsView.vue'
import Users from '../views/UsersView.vue'
import Profile from '../views/ProfileView.vue'
import ForbiddenAccess from '../components/ForbiddenAccess.vue'

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
      meta: { requiresAuth: true, requiredRole: ['admin', 'professional'] }
    },
    {
      path: '/professionals',
      name: 'professionals',
      component: Professionals,
      meta: { requiresAuth: true }
    },
    {
      path: '/appointments',
      name: 'appointments',
      component: Appointments,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
     {
      path: '/my-appointments',
      name: 'my-appointments',
      component: MyAppointments,
      meta: { requiresAuth: true , requiredRole: ['patient', 'professional']}
    },
      {
      path: '/users',
      name: 'users',
      component: Users,
      meta: { requiresAuth: true, requiredRole: ['admin'] }
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile,
      meta: { requiresAuth: true }
    },
    {
      path: '/forbidden',
      name: 'forbidden',
      component: ForbiddenAccess
    }
  ],
})

// Guard de autenticación mejorado
router.beforeEach((to, from, next) => {
  const { isAuthenticated, hasPermission } = useAuth()
  
  // Verificar autenticación
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next('/login')
    return
  }
  
  // Verificar permisos de rol
  if (to.meta.requiredRole && !hasPermission(to.meta.requiredRole)) {
    next('/forbidden') // Redirigir a página de acceso prohibido
    return
  }
  
  next()
})

export default router
