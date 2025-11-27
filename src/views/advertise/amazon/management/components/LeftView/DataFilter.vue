<template>
  <div class="flex-center-start">
    <FaDropdown :items="commandOptions">
      <el-button type="default" link>
        {{ options.find(item => item.value === value)?.label }}
      </el-button>
    </FaDropdown>
    <el-button link @click="isDesc = !isDesc">
      <FaIcon :name="isDesc ? 'i-ep:sort-down' : 'i-ep:sort-up'" />
    </el-button>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(['change'])
const model = defineModel<ObjectAny>({ default: () => ({}) })
const options = [
  { label: '广告花费', value: 'cost' },
  { label: '曝光量', value: 'impressions' },
  { label: '点击量', value: 'clicks' },
  { label: 'CTR', value: 'ctr' },
  { label: 'CPC', value: 'cpc' },
  { label: '广告总销售额', value: 'sales' },
  { label: 'ACOS', value: 'acos' },
  { label: 'ROAS', value: 'roas' },
  { label: '广告总订单量', value: 'purchases' },
  { label: 'CVR', value: 'cvr' },
  { label: 'CPA', value: 'cpa' },
]
const value = ref(options[0].value)
const isDesc = ref(true)
const { setSort } = useUtils()
const init = ref(true)
watch([value, isDesc], () => {
  setSort({ prop: value.value, order: isDesc.value ? 'desc' : 'asc' }, model.value)
  if (init.value) {
    init.value = false
    return
  }
  emit('change')
}, { immediate: true })
const commandOptions = [
  options.map(item => ({
    label: item.label,
    handle: () => {
      value.value = item.value
    },
  })),
]
</script>
