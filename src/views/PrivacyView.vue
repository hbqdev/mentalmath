<script setup lang="ts"></script>

<template>
  <div class="privacy">
    <p class="kicker">Privacy</p>
    <h1>We collect nothing</h1>
    <p>
      Mental Math Trainer does not collect, transmit or share any data about you. There are no
      accounts, no analytics, no advertising and no third-party SDKs. The app makes no network
      requests other than to load its own files, and there is no server that receives anything from
      it. Nobody, including the developer, can see what you read or how you score.
    </p>
    <h2>What the app remembers, on this device only</h2>
    <p>
      Like a game keeping its save, the app writes a small amount of information to this device so
      it can pick up where you left off: the sections you have read, your practice results, your
      streak and your settings. It never leaves the device.
    </p>
    <h2>Your control</h2>
    <p>
      From Settings you can save that information as a file, restore it on another device, or erase
      it with “Reset everything”. Uninstalling the app, or clearing site data in the browser, erases
      it as well.
    </p>
    <p>
      The app is not affiliated with the authors or publisher of <em>Secrets of Mental Math</em>.
      Questions: hbq.dev@gmail.com.
    </p>
  </div>
</template>

<style scoped>
.privacy {
  max-width: var(--measure);
  margin: 0 auto;
  padding: 2rem var(--gutter) 5rem;
}
h1 {
  font-size: 1.6rem;
  margin: 0.25rem 0 1rem;
}
h2 {
  font-size: 1.05rem;
  margin: 1.5rem 0 0.5rem;
  font-family: var(--font-sans);
}
</style>
