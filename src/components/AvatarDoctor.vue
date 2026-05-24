<script setup lang="ts">
defineProps<{ size?: number }>()

import doctorImg from '@/img/医生头像.jpg'
</script>

<template>
  <div class="avatar-doctor" :style="{ width: (size || 40) + 'px', height: (size || 40) + 'px' }">
    <img :src="doctorImg" alt="医生" />
  </div>
</template>

<style scoped>
.avatar-doctor {
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--color-surface);
  border: 1.5px solid var(--color-primary);
}
.avatar-doctor img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
