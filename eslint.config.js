import antfu from '@antfu/eslint-config'
import vueI18n from '@intlify/eslint-plugin-vue-i18n'

export default antfu(
  {
    unocss: true,
    ignores: [
      'public',
      'dist*',
    ],
  },
  {
    rules: {
      'eslint-comments/no-unlimited-disable': 'off',
      'curly': ['error', 'all'],
      'ts/no-unused-expressions': ['error', {
        allowShortCircuit: true,
        allowTernary: true,
      }],
      // 控制花括号样式 - 使单行模式
      // 'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      // 允许块语句使用单行
      'style/block-spacing': ['error', 'always'],
      // 控制关键字周围空格 - 确保关键字和花括号之间有空格
      'style/keyword-spacing': ['error', {
        before: true,
        after: true,
      }],
      // 允许单行块
      'style/padded-blocks': ['error', {
        blocks: 'never',
        switches: 'never',
        classes: 'never',
      }],
      // 允许每行有多个语句
      'style/max-statements-per-line': 'off',
      'unicorn/prefer-node-protocol': 'off',
    },
  },
  {
    files: [
      'src/**/*.vue',
    ],
    rules: {
      'vue/block-order': ['error', {
        order: ['route', 'i18n', 'template', 'script', 'style'],
      }],
    },
  },
  ...vueI18n.configs['flat/recommended'],
  {
    rules: {
      '@intlify/vue-i18n/no-raw-text': 'off',
    },
    settings: {
      'vue-i18n': {
        localeDir: './src/locales/lang/*.{json,json5,yaml,yml}',
        messageSyntaxVersion: '^10.0.0',
      },
    },
  },
)
