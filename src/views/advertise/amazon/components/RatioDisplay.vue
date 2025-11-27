<template>
  <div>
    <!-- 字段值 -->
    <div class="w-fit flex-center-start gap-1">
      <div
        class="w-fit flex gap-1" :class="{ 'flex-row-reverse': endSymbol, 'cursor-pointer hover:c-blue': showTrendAnalysis }"
        @click="showTrendAnalysis && openTrendAnalysisDialog(field, row, commonTabType, trendExtSearch)"
      >
        <div>{{ currencySymbol }}</div>
        <div>{{ row[`${field}Ratio`]?.value || '0' }}</div>
      </div>
      <slot name="value-append" :value="row[`${field}Ratio`]?.value" />
    </div>
    <!-- 环比值 -->
    <div v-if="showRatio || showRatioValue" class="w-fit flex gap-1 c-gray" :class="{ 'flex-row-reverse': endSymbol }">
      <div>{{ currencySymbol }}</div>
      <div>{{ row[`${field}Ratio`]?.ratioValue || '0' }}</div>
    </div>
    <!-- 环比 -->
    <div v-if="(showRatio || showRatioChange) && row[`${field}Ratio`]" class="flex-center-start gap-1" :class="trend === 'up' ? 'c-green' : trend === 'down' ? 'c-red' : 'c-gray'">
      <FaIcon v-if="!!trendIcon" :name="trendIcon" />
      <div>
        {{ row[`${field}Ratio`].rate }}%
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommonTabType } from '@/utils/hooks/useAmazonAdsUtils'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'

const props = defineProps({
  options: {
    type: Object,
    default: () => ({}),
  },
})
const { openTrendAnalysisDialog } = useAmazonAdsUtils()
const commonTabType = inject<Ref<CommonTabType>>('commonTabType', ref(''))
const field = computed(() => props.options?.field || {})
const row = computed(() => props.options?.row || {})
const showRatio = computed(() => props.options?.showRatio || false)
const showRatioValue = computed(() => props.options?.showRatioValue || false)
const showRatioChange = computed(() => props.options?.showRatioChange || false)
const showTrendAnalysis = computed(() => props.options?.showTrendAnalysis || true)
const trendExtSearch = computed(() => props.options?.trendExtSearch || {})
const currencySymbol = computed(() => row.value[`${field.value}Ratio`]?.currencySymbol ? row.value[`${field.value}Ratio`]?.currencySymbol : '')
const endSymbol = computed(() => ['%'].includes(currencySymbol.value))
const trend = computed(() => {
  const rate = row.value[`${field.value}Ratio`]?.rate
  if (rate > 0) { return 'up' }
  if (rate === 0) { return 'stable' }
  if (rate < 0) { return 'down' }
  return ''
})
const trendIcon = computed(() => {
  switch (trend.value) {
    case 'up':
      return 'i-material-symbols:trending-up'
    case 'stable':
      return 'i-material-symbols:trending-flat'
    case 'down':
      return 'i-material-symbols:trending-down'
    default:
      return ''
  }
})
</script>
