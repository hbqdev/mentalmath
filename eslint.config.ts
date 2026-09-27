import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  { name: 'app/files-to-lint', files: ['**/*.{ts,mts,tsx,vue,js,mjs}'] },
  {
    name: 'app/files-to-ignore',
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      'public/**',
      'src/content/chapters/**',
    ],
  },
  {
    // Legacy JS code kept alive until later tasks/plans replace it.
    name: 'app/legacy-until-plan-2',
    ignores: ['src/App.vue', 'src/components/**', 'src/views/**', 'src/utils/**', 'src/data/**'],
  },
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  skipFormatting,
)
