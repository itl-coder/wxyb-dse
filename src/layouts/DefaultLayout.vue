<template>
  <div class="app-layout" :class="`subject-${currentSubject}`">
    <AppHeader :current-subject="currentSubject" @switch-subject="handleSubjectSwitch" />
    <AppNavbar v-if="isMathSubject" :current-page="currentPage" />
    <main class="main-content" :class="{ 'no-navbar': !isMathSubject }">
      <router-view v-slot="{ Component }">
        <keep-alive :include="keepAlivePages">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/common/AppHeader.vue'
import AppNavbar from '@/components/common/AppNavbar.vue'

const route = useRoute()
const router = useRouter()
const currentSubject = ref('math')

const mathRoutes = ['Home', 'Geometry3D', 'Trigonometry', 'LogExp', 'CircleLine', 'Composite', 'Locus', 'TriangleCenter', 'Quadratic', 'Sequence', 'Probability', 'Statistics', 'Polynomial', 'Inequality', 'Numbers', 'Practice', 'Mistakes', 'Knowledge']

// Keep-alive cache list for math pages that need state persistence
const keepAlivePages = ['Geometry3D', 'Trigonometry', 'LogExp', 'CircleLine', 'Composite', 'Locus', 'TriangleCenter', 'Quadratic', 'Sequence', 'Probability', 'Statistics', 'Polynomial', 'Inequality', 'Numbers']

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

// Scroll effects
let scrollObserver = null
onMounted(() => {
  const navbar = document.querySelector('.app-navbar')
  const header = document.querySelector('.app-header')
  const revealEls = document.querySelectorAll('.reveal-on-scroll')

  const onScroll = () => {
    const y = window.scrollY
    if (navbar) navbar.classList.toggle('scrolled', y > 10)
    if (header) header.style.setProperty('--scroll-y', y)
  }
  window.addEventListener('scroll', onScroll, { passive: true })

  if (revealEls.length > 0) {
    scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible')
      })
    }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' })
    revealEls.forEach(el => scrollObserver.observe(el))
  }

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
    if (scrollObserver) scrollObserver.disconnect()
  })
})
</script>
