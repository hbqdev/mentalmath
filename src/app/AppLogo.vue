<script setup lang="ts">
defineProps<{ size?: number }>()
</script>

<template>
  <!-- The app mark: the book's lightbulb with M² inside. Same drawing as public/favicon.svg. -->
  <svg class="logo" :width="size ?? 26" :height="size ?? 26" viewBox="0 0 64 64" aria-hidden="true">
    <rect width="64" height="64" rx="14" fill="var(--accent)" />
    <path
      d="M32 9c-8.6 0-14.5 6.3-14.5 13.8 0 5.1 2.8 8.2 5 10.6 1.6 1.8 2.7 3.3 2.7 5.6v1.5h13.6V39c0-2.3 1.1-3.8 2.7-5.6 2.2-2.4 5-5.5 5-10.6C46.5 15.3 40.6 9 32 9z"
      fill="none"
      stroke="var(--accent-ink)"
      stroke-width="3"
    />
    <path
      d="M26 46h12M27.5 51h9"
      stroke="var(--accent-ink)"
      stroke-width="3"
      stroke-linecap="round"
    />
    <text
      x="29.5"
      y="31.5"
      text-anchor="middle"
      font-family="var(--font-serif)"
      font-weight="700"
      font-size="17"
      fill="var(--warm)"
    >
      M
    </text>
    <text
      x="39.5"
      y="22"
      text-anchor="middle"
      font-family="var(--font-serif)"
      font-weight="700"
      font-size="8.5"
      fill="var(--accent-ink)"
    >
      2
    </text>
  </svg>
</template>

<style scoped>
.logo {
  display: block;
  flex: none;
}
</style>
