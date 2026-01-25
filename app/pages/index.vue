<script setup lang="ts">
// Redirect to dashboard
definePageMeta({
  middleware: 'admin',
})

const router = useRouter()
onMounted(() => {
  router.replace('/dashboard')
})
</script>

<template>
  <div />
</template>
