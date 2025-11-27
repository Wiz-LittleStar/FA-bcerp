<template>
  <div ref="chartRef" :class="cn('h-[400px] w-full', props.class)" />
</template>

<script setup lang="ts">
import type { ECharts, EChartsOption, SetOptionOpts } from 'echarts'
import type { HTMLAttributes } from 'vue'
import * as Echarts from 'echarts'
import { cn } from '@/utils'

const props = withDefaults(defineProps<{
  options?: EChartsOption
  opts?: SetOptionOpts
  class?: HTMLAttributes['class']
}>(), {
  options: () => ({}),
  opts: () => ({ notMerge: true }),
})
const emit = defineEmits<{
  (e: 'ready', chart: ECharts): void
}>()

const { options, opts } = toRefs(props)

const chartRef = useTemplateRef('chartRef')
const chart = ref<ECharts>()

function initChart() {
  chart.value = Echarts.init(chartRef.value)
  chart.value.setOption(options.value)
  emit('ready', chart.value)
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => {
    nextTick(() => chart.value?.resize())
  })
})

watch(options, (newOptions) => {
  nextTick(() => chart.value?.setOption(newOptions, opts.value))
}, { deep: true })
</script>
