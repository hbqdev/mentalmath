<script setup lang="ts">
import { ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { useProgress } from '@/app/progress'
import ThemePicker from '@/app/ThemePicker.vue'
import TextControls from '@/app/TextControls.vue'

const { state, exportJson, importJson, reset } = useProgress()
const native = Capacitor.isNativePlatform()
const notice = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

async function download() {
  const name = `mentalmath-progress-${new Date().toISOString().slice(0, 10)}.json`
  if (native) {
    // A WebView cannot download a blob; write the file and hand it to the share sheet (Files, Drive, mail…).
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'),
      import('@capacitor/share'),
    ])
    const { uri } = await Filesystem.writeFile({
      path: name,
      data: exportJson(),
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    })
    await Share.share({ title: 'Mental Math backup', files: [uri] }).catch(() => {})
    notice.value = 'Backup ready to save or send.'
    return
  }
  const blob = new Blob([exportJson()], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
  notice.value = 'Backup saved.'
}
async function onImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const ok = importJson(await file.text())
  notice.value = ok ? 'Progress restored.' : 'That file is not a Mental Math backup.'
  ;(e.target as HTMLInputElement).value = ''
}
function resetAll() {
  if (window.confirm('Erase all reading progress, practice history and settings on this device?')) {
    reset()
    notice.value = 'Everything reset.'
  }
}
</script>

<template>
  <div class="settings">
    <h1>Settings</h1>

    <section>
      <h2>Appearance</h2>
      <ThemePicker inline />
    </section>

    <section>
      <h2>Text</h2>
      <TextControls />
    </section>

    <section>
      <h2>Reading</h2>
      <label class="switch">
        <input v-model="state.settings.pagedReader" type="checkbox" data-testid="setting-paged" />
        <span
          ><strong>One section per page on phones</strong
          ><small
            >Swipe or use the arrows to move between sections. Off scrolls the whole chapter.</small
          ></span
        >
      </label>
      <label class="switch">
        <input v-model="state.settings.lockUntilRead" type="checkbox" data-testid="setting-lock" />
        <span
          ><strong>Unlock exercises by reading</strong
          ><small
            >A set opens once its section has been on screen. Off keeps every set open.</small
          ></span
        >
      </label>
    </section>

    <section>
      <h2>Practice</h2>
      <label class="switch">
        <input v-model="state.settings.showTimer" type="checkbox" data-testid="setting-timer" />
        <span
          ><strong>Show the clock</strong
          ><small>Time per set is always recorded; this shows it while you work.</small></span
        >
      </label>
      <label v-if="native" class="switch">
        <input v-model="state.settings.haptics" type="checkbox" data-testid="setting-haptics" />
        <span
          ><strong>Vibrate on check</strong
          ><small>A short tap for a correct answer, a buzz for a miss.</small></span
        >
      </label>
    </section>

    <section>
      <h2>Your data</h2>
      <p class="note">Everything is stored only on this device. Nothing is sent anywhere.</p>
      <div class="actions">
        <button type="button" class="btn" data-testid="export-progress" @click="download">
          Save a backup
        </button>
        <button
          type="button"
          class="btn ghost"
          data-testid="import-progress"
          @click="fileInput?.click()"
        >
          Restore a backup
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="application/json,.json"
          hidden
          data-testid="import-file"
          @change="onImport"
        />
        <button type="button" class="btn danger" data-testid="reset-progress" @click="resetAll">
          Reset everything
        </button>
      </div>
      <p v-if="notice" class="note" role="status" data-testid="settings-notice">{{ notice }}</p>
    </section>

    <section class="links">
      <RouterLink to="/about">About this app</RouterLink>
      <RouterLink to="/privacy">Privacy</RouterLink>
    </section>
  </div>
</template>

<style scoped>
.settings {
  max-width: 40rem;
  margin: 0 auto;
  padding: 1.5rem var(--gutter) 5rem;
  font-family: var(--font-sans);
}
h1 {
  font-size: 1.8rem;
  margin: 0 0 1rem;
}
section {
  padding: 1rem 0;
  border-top: 1px solid var(--rule);
}
h2 {
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 0.75rem;
}
.switch {
  display: flex;
  gap: 0.8rem;
  align-items: flex-start;
  padding: 0.5rem 0;
  min-height: 44px;
}
.switch input {
  width: 22px;
  height: 22px;
  margin-top: 0.15rem;
  accent-color: var(--accent);
  flex: none;
}
.switch span {
  display: grid;
  gap: 0.15rem;
}
.switch small {
  color: var(--muted);
  font-size: 0.85rem;
}
.note {
  color: var(--muted);
  margin: 0 0 0.6rem;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.btn {
  font: inherit;
  font-weight: 700;
  padding: 0.55rem 0.9rem;
  border-radius: var(--radius);
  border: 1px solid var(--accent);
  background: var(--accent);
  color: var(--accent-ink);
  min-height: 40px;
}
.btn.ghost {
  background: transparent;
  color: var(--accent);
}
.btn.danger {
  background: transparent;
  color: var(--muted);
  border-color: var(--rule);
}
.links {
  display: flex;
  gap: 1.25rem;
}
</style>
