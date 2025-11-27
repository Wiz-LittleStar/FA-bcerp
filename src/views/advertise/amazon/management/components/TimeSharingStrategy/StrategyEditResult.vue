<template>
  <div class="flex-center-start gap-1">
    <span :style="{ color: info.color }">{{ info.display }}</span>
    <el-tooltip v-if="info.tooltip" placement="top">
      <template #content>
        <div class="ws-pre-wrap">
          {{ info.tooltip }}
        </div>
      </template>
      <FaIcon name="i-ep:question-filled" class="size-3" />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import type { AdjustType } from '@/utils/hooks/useAmazonAdsUtils'
import useAmazonAdsTimeSharingStrategyUtils from '@/utils/hooks/useAmazonAdsTimeSharingStrategyUtils'

const props = withDefaults(defineProps<{
  adjustType?: AdjustType
  inAdvanceValue?: number
}>(), {
  value: () => ({}),
  inAdvanceValue: 0,
})
const setting = defineModel<ObjectAny>()
const { adjustType, inAdvanceValue } = toRefs(props)

const { inAdvanceInfo } = useAmazonAdsTimeSharingStrategyUtils()
const info = computed(() => inAdvanceInfo(adjustType.value, setting.value, inAdvanceValue.value))
</script>
