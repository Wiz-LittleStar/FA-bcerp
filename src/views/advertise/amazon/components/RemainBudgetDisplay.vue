<template>
  <div class="min-w-40">
    <el-progress
      v-if="info.budgetUsagePercent < 0"
      :percentage="100"
      color="#ff5c5c"
      :format="() => '超预算'"
    />
    <el-progress
      v-else
      :percentage="Number((info.budgetUsagePercent || 0).toFixed(1))"
      :color="colorMethod"
      :format="formatMethod"
    />
    <div class="flex-center-start gap-2">
      <div>已花:<span class="fw-bold">${{ info.spentBudget }}</span></div>
      <div v-if="info.budgetUsagePercent >= 0">
        剩余:<span class="fw-bold">${{ info.remainingBudget }}</span>
      </div>
      <div v-else>
        超出:<span class="fw-bold">{{ Math.abs(info.budgetUsagePercent) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
})
const { data } = toRefs(props)
const info = computed(() => isObject(data.value) ? data.value : {})
// 进度条颜色
function colorMethod(percentage: number) {
  const result = percentage < 10 ? '#ff5c5c' : percentage < 50 ? '#e6a23c' : '#0045f0'
  return result
}
// 格式化预算剩余
function formatMethod(percentage: number) {
  return percentage < 0 ? '超预算' : `${percentage}%`
}
</script>
