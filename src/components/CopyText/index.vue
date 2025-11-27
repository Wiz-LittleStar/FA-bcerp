<i18n lang="json">
  {
    "zh-cn": {
      "tip": "提示",
      "copySuccess": "复制成功",
      "copyError": "复制失败",
      "notSupported": "不支持复制"
    },
    "zh-TW": {
      "tip": "提示",
      "copySuccess": "複製成功",
      "copyError": "複製失敗",
      "notSupported": "不支持複製"
    },
    "en": {
      "tip": "Tip",
      "copySuccess": "Copy Success",
      "copyError": "Copy Error",
      "notSupported": "Not Supported Copy"
    }
  }
</i18n>

<template>
  <div v-if="model" :title="model" class="group flex-center-start gap-1">
    <el-text v-bind="$attrs">
      {{ model }}
    </el-text>
    <FaIcon
      name="i-ep:copy-document"
      class="cursor-pointer op-0 transition-opacity duration-300 hover:c-blue group-hover:op-100"
      @click.stop="copy(model)"
    />
  </div>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

const model = defineModel<string | null | undefined>({ required: true })

const { t } = useI18n()
const { copy, copied, isSupported } = useClipboard()

watchEffect(() => {
  if (copied.value) {
    toast.success(t('tip'), {
      description: t('copySuccess'),
    })
  }
  if (!isSupported.value) {
    toast.error(t('tip'), {
      description: t('notSupported'),
    })
  }
})
</script>
