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

/** Android back: go back through the app's history; leave the app only from the home screen. */
export function useAndroidBack(router: {
  back: () => void
  currentRoute: { value: { name?: unknown } }
}) {
  if (!Capacitor.isNativePlatform()) return
  import('@capacitor/app').then(({ App }) => {
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack && router.currentRoute.value.name !== 'home') router.back()
      else App.exitApp()
    })
  })
}

/** A short tap for a correct answer, a buzz for a miss (native app only, and only when enabled). */
export async function hapticResult(correct: boolean, enabled: boolean) {
  if (!enabled || !Capacitor.isNativePlatform()) return
  const { Haptics, NotificationType } = await import('@capacitor/haptics')
  await Haptics.notification({ type: correct ? NotificationType.Success : NotificationType.Error })
}

/** Keep the screen on while a drill is running. */
export async function keepAwake(on: boolean) {
  if (!Capacitor.isNativePlatform()) return
  const { KeepAwake } = await import('@capacitor-community/keep-awake')
  if (on) await KeepAwake.keepAwake()
  else await KeepAwake.allowSleep()
}
