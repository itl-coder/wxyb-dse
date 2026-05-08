<template>
  <div class="app-layout" :class="`subject-${currentSubject}`">
    <AppHeader :current-subject="currentSubject" @switch-subject="handleSubjectSwitch" />
    <AppNavbar v-if="isMathSubject" :current-page="currentPage" />
    <main class="main-content" :class="{ 'no-navbar': !isMathSubject }">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/common/AppHeader.vue'
import AppNavbar from '@/components/common/AppNavbar.vue'

const route = useRoute()
const router = useRouter()
const currentSubject = ref('math')

const mathRoutes = ['Home', 'Geometry3D', 'Trigonometry', 'LogExp', 'CircleLine', 'Composite', 'Locus', 'TriangleCenter', 'MovingPoint', 'Quadratic', 'Sequence', 'Probability', 'Statistics', 'Polynomial', 'Inequality', 'Numbers', 'Practice', 'Mistakes', 'Knowledge']

const currentPage = computed(() => route.name || 'Home')

const isMathSubject = computed(() => {
  return mathRoutes.includes(route.name) || currentSubject.value === 'math'
})

// Sync subject state from route changes
watch(() => route.name, (name) => {
  if (name === 'Chinese') currentSubject.value = 'chinese'
  else if (name === 'Physics') currentSubject.value = 'physics'
  else if (name === 'Chemistry') currentSubject.value = 'chemistry'
  else if (mathRoutes.includes(name) || name === 'Home') currentSubject.value = 'math'
})

function handleSubjectSwitch(subject) {
  currentSubject.value = subject
  if (subject === 'math') {
    router.push('/')
  } else if (subject === 'chinese') {
    router.push('/chinese')
  } else if (subject === 'physics') {
    router.push('/physics')
  } else if (subject === 'chemistry') {
    router.push('/chemistry')
  }
}
</script>
