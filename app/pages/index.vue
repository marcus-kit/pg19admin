<script setup lang="ts">
// Редирект на дашборд
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
