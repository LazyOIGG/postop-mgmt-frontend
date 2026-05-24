<script setup lang="ts">
defineProps<{ size?: number }>()
</script>

<template>
  <div class="avatar-patient" :style="{ width: (size || 40) + 'px', height: (size || 40) + 'px' }">
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="60" fill="#B08B6E" opacity="0.12"/>
      <path d="M36 85c0-13.3 10.7-24 24-24s24 10.7 24 24v8c0 3.3-2.7 6-6 6H42c-3.3 0-6-2.7-6-6v-8z" fill="#8B9D83"/>
      <path d="M46 64l14 8 14-8" stroke="#7A8D72" stroke-width="1.5" fill="none"/>
      <circle cx="60" cy="42" r="15" fill="#B08B6E" opacity="0.25"/>
      <circle cx="60" cy="42" r="15" fill="none" stroke="#8B9D83" stroke-width="2"/>
      <path d="M45 39c0-7 6.7-11 15-11s15 4 15 11c-3-4-8-5-15-5s-12 1-15 5z" fill="#5A4A3A"/>
      <circle cx="54" cy="42" r="2" fill="#8B9D83"/>
      <circle cx="66" cy="42" r="2" fill="#8B9D83"/>
      <path d="M55 49c2 1.5 8 1.5 10 0" stroke="#8B9D83" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M55 73l2-4 3 7 2-6 3 8 2-5 1 2h5" stroke="#C66B3D" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
</template>

<style scoped>
.avatar-patient {
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, rgba(176,139,110,0.08), rgba(176,139,110,0.15));
}
.avatar-patient svg {
  width: 100%;
  height: 100%;
}
</style>
