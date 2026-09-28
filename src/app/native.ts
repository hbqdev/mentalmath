import { Capacitor } from '@capacitor/core'
import { watchEffect } from 'vue'
import { useTheme } from './theme'

/**
 * Inside the Android app, colour the status and navigation bars like the header so the theme
 * runs edge to edge. Does nothing on the web, where the browser owns those bars.
 */
export function useNativeBars() {
  if (!Capacitor.isNativePlatform()) return
  const { resolved } = useTheme()
  watchEffect(async () => {
    const dark = resolved.value === 'dark'
    const surface =
      getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() ||
      (dark ? '#0b1118' : '#fbf8f1')
    const [{ StatusBar, Style }, { EdgeToEdge }] = await Promise.all([
      import('@capacitor/status-bar'),
      import('@capawesome/capacitor-android-edge-to-edge-support'),
    ])
    await EdgeToEdge.setBackgroundColor({ color: surface })
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light })
  })
}
