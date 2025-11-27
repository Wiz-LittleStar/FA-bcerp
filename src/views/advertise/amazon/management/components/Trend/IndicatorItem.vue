<template>
  <div
    class="relative flex flex-col cursor-pointer gap-1 border b-rd-2 p-2 transition-background-color hover:translate-y-[-2px]"
  >
    <div
      v-show="data.isSelect && color"
      class="absolute left-0 top-0 z-33 h-1 w-full b-rd-t-2"
      :style="{ backgroundColor: color }"
    />
    <div class="flex-center-between text-3 c-gray-700">
      <span>{{ data.title }}
        <span v-if="data.currencySymbol">{{ `(${data.currencySymbol})` }}</span>
      </span>
      <slot name="operation" />
    </div>
    <div class="flex items-end gap-2">
      <span class="text-4 c-#303133 fw-bold">{{ data.value || 0 }} <span
        v-if="percentFields.includes(data.name)"
      >%</span></span>
      <span class="text-3" :class="avgFields.includes(data.name) ? 'c-orange' : 'c-blue'">
        {{ avgFields.includes(data.name) ? '平均' : '总计' }}
      </span>
    </div>
    <div class="flex-center-start gap-2 text-3">
      <span class="c-#86909c">环比</span>
      <div class="c-#4e5969">
        {{ data.ratioValue || 0 }}
      </div>
      <div class="flex-center-start gap-1" :class="trendType(data.rate) === 'up' ? 'c-red' : trendType(data.rate) === 'down' ? 'c-green' : 'c-#86909c'">
        <div>{{ data.rate }}%</div>
        <FaIcon v-if="!!trendIcon(trendType(data.rate))" :name="trendIcon(trendType(data.rate))" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'

const props = withDefaults(defineProps<{
  data?: ObjectAny
  color?: string
}>(), {
  data: () => ({}),
  color: '',
})
const { data, color } = toRefs(props)

const { avgFields, percentFields } = useAmazonAdsUtils()
function trendType(rate: number) {
  const value = Number(rate)
  if (value > 0) { return 'up' }
  if (value === 0) { return 'stable' }
  if (value < 0) { return 'down' }
  return ''
}
function trendIcon(trendType: string) {
  switch (trendType) {
    case 'up':
      return 'i-material-symbols:trending-up'
    case 'stable':
      return 'i-material-symbols:trending-flat'
    case 'down':
      return 'i-material-symbols:trending-down'
    default:
      return ''
  }
}
</script>
