// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

// Nuxt server auto-imports
const serverGlobals = {
  // H3 event handlers
  defineEventHandler: 'readonly',
  getRouterParam: 'readonly',
  getQuery: 'readonly',
  readBody: 'readonly',
  createError: 'readonly',

  // Supabase server
  serverSupabaseClient: 'readonly',
  serverSupabaseServiceRole: 'readonly',
  serverSupabaseUser: 'readonly',
}

export default withNuxt(
  // Конфиг для server/ файлов — добавляем auto-imports
  {
    files: ['server/**/*.ts'],
    languageOptions: {
      globals: serverGlobals,
    },
  },
  // Общие правила
  {
    rules: {
      // ═══════════════════════════════════════════════════════════════════════
      // Vue правила по CODE-STYLE-GUIDE
      // ═══════════════════════════════════════════════════════════════════════

      // Порядок блоков: script → template → style
      'vue/block-order': ['error', {
        order: ['script', 'template', 'style'],
      }],

      // Порядок атрибутов: v-if → v-for → :key → ref → v-model → :props → @events → class
      'vue/attributes-order': ['error', {
        order: [
          'CONDITIONALS', // v-if, v-else-if, v-else, v-show
          'LIST_RENDERING', // v-for
          'UNIQUE', // key, ref, slot
          'TWO_WAY_BINDING', // v-model
          'DEFINITION', // is, v-is
          'OTHER_DIRECTIVES', // v-custom-directive
          'ATTR_DYNAMIC', // :prop
          'EVENTS', // @click — перед class по CODE-STYLE-GUIDE
          'ATTR_STATIC', // class, placeholder
          'ATTR_SHORTHAND_BOOL', // disabled
          'CONTENT', // v-text, v-html
        ],
        alphabetical: false,
      }],

      // Многословные имена компонентов — выключено (используем префиксы папок)
      'vue/multi-word-component-names': 'off',

      // Слишком строгие — отключаем
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/require-default-prop': 'off',
      'vue/html-self-closing': 'off',

      // ═══════════════════════════════════════════════════════════════════════
      // Общие правила
      // ═══════════════════════════════════════════════════════════════════════

      // console.log — предупреждение, console.warn/error — ок
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // var запрещён
      'no-var': 'error',

      // Всегда const если не переназначается
      'prefer-const': 'error',

      // ═══════════════════════════════════════════════════════════════════════
      // TypeScript правила
      // ═══════════════════════════════════════════════════════════════════════

      // Пустые интерфейсы — часто используются для расширения
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
)
