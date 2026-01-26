<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
})

// Редирект на страницу заявок на подключение
navigateTo('/requests/connection', { replace: true })
</script>

<template>
  <div />
</template>
