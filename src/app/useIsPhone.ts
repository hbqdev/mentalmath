import { useBreakpoints } from '@vueuse/core'

/** One breakpoint set for the whole app: phones get the tab bar, paged reader and drill screen. */
export const breakpoints = useBreakpoints({ tablet: 720, desktop: 1024 })
export const useIsPhone = () => breakpoints.smaller('tablet')
