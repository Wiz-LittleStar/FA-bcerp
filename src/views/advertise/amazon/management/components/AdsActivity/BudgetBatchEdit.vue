<template>
  <FaModal v-model="modalShow" :title="title" show-cancel-button :confirm-button-loading="loading" class="max-w-6xl" :before-close="submit">
    <div class="h-70vh">
      <vxe-grid :data="data" v-bind="gridOptions">
        <template #toolbarButtons>
          <div class="flex-center-start gap-2">
            <div class="fw-bold">
              批量设置
            </div>
            <el-select v-model="adjustType" size="small" class="w-50">
              <el-option v-for="item in adjustTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-input-number v-model="adjustValue" size="small" class="w-50" :min="0" :controls="false">
              <template v-if="['increasePercentage', 'decreasePercentage'].includes(adjustType)" #suffix>
                <span>%</span>
              </template>
              <template v-else #prefix>
                <span>$</span>
              </template>
            </el-input-number>
            <el-input-number v-if="adjustType !== 'adjustAmount'" v-model="adjustlimit" size="small" class="w-50" :min="0" :controls="false">
              <template v-if="['increasePercentage', 'decreasePercentage'].includes(adjustType)" #suffix>
                <span>%</span>
              </template>
              <template v-else #prefix>
                <span>$</span>
              </template>
            </el-input-number>
            <el-button type="primary" size="small" @click="apply()">
              <template #icon>
                <FaIcon name="i-ep:check" />
              </template>
              应用
            </el-button>
            <el-button type="warning" size="small" @click="resetBudget()">
              <template #icon>
                <FaIcon name="i-ep:refresh" />
              </template>
              重置
            </el-button>
          </div>
        </template>
        <template #budget="{ row }">
          <el-input-number v-model="row.budget" size="small" :min="0" :controls="false" class="w-full">
            <template #prefix>
              <span>$</span>
            </template>
            <template #suffix>
              <span>/日</span>
            </template>
          </el-input-number>
        </template>
      </vxe-grid>
    </div>
  </FaModal>
</template>

<script setup lang="ts">
import type { VxeGridProps } from 'vxe-table'
import { cloneDeep } from 'es-toolkit'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

function initForm(): {
  show: boolean
  data: ObjectAny[]
  loading: boolean
} {
  return {
    show: false,
    data: [],
    loading: false,
  }
}
const form = reactive(initForm())
const { show: modalShow, data, loading } = toRefs(form)
const title = computed(() => '调整预算')

const gridOptions = reactive<VxeGridProps>({
  size: 'mini',
  height: 'auto',
  columnConfig: {
    resizable: true,
    minWidth: 'auto',
  },
  rowConfig: {
    isCurrent: true,
    isHover: true,
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbarButtons',
    },
  },
  scrollY: {
    enabled: true,
    gt: 20,
  },
  columns: [
    { field: 'shopName', title: '店铺' },
    { field: 'name', title: '广告活动' },
    { field: 'budget', title: '调整预算', slots: { default: 'budget' } },
    { field: 'currentBudget', title: '当前预算', formatter: ({ cellValue }) => cellValue ? `$${cellValue}/日` : '-' },
  ],
})

const adjustTypeOptions = [
  { value: 'increaseAmount', label: '提高 (数值)' },
  { value: 'increasePercentage', label: '提高 (百分比)' },
  { value: 'adjustAmount', label: '将预算调整到' },
  { value: 'decreaseAmount', label: '降低 (数值)' },
  { value: 'decreasePercentage', label: '降低 (%)' },
]
const adjustType = ref<string>(adjustTypeOptions[0].value)
const adjustValue = ref<number | undefined>(undefined)
const adjustlimit = ref<number | undefined>(undefined)
function getAdjustAmount(value: number) {
  if (adjustType.value === 'increaseAmount') {
    const result = value + (adjustValue?.value ?? 0)
    return adjustlimit.value ? Math.min(result, adjustlimit.value) : result
  }
  else if (adjustType.value === 'increasePercentage') {
    const result = value * (1 + (adjustValue?.value ?? 0) / 100)
    return adjustlimit.value ? Math.min(result, adjustlimit.value) : result
  }
  else if (adjustType.value === 'adjustAmount') {
    return adjustValue?.value ?? 0
  }
  else if (adjustType.value === 'decreaseAmount') {
    const result = value - (adjustValue?.value ?? 0)
    return adjustlimit.value ? Math.max(result, adjustlimit.value) : result
  }
  else if (adjustType.value === 'decreasePercentage') {
    const result = value * (1 - (adjustValue?.value ?? 0) / 100)
    return adjustlimit.value ? Math.max(result, adjustlimit.value) : result
  }
}
function apply() {
  data.value.forEach((item) => {
    item.budget = getAdjustAmount(item.currentBudget)
  })
}
function resetBudget() {
  data.value.forEach((item) => {
    item.budget = item.currentBudget
  })
  adjustValue.value = undefined
  adjustlimit.value = undefined
}

function reset() {
  Object.assign(form, initForm())
}

async function show(params: ObjectAny[] = []) {
  reset()
  data.value = cloneDeep(params).map(item => ({
    ...item,
    currentBudget: item.budget,
  }))
  modalShow.value = true
}
defineExpose({ show })

const { getUpdateBudgetMethod } = useAmazonAdsUtils()
async function submit(action: 'confirm' | 'cancel' | 'close', done: () => void) {
  loading.value = true
  try {
    if (action !== 'confirm') {
      return done()
    }
    if (data.value.some(item => !item.budget || Number(item.budget) === 0)) { return toast.error('请检查是否填写完整表单且预算不能为0') }
    const tmp = data.value.reduce((res, { type, shopId, campaignId, budget, budgetType }) => {
      const tmp = {
        budget: {
          budget,
          budgetType,
        },
        shopId,
        campaignId,
      }
      if (Array.isArray(res[type])) {
        res[type].push(tmp)
      }
      else {
        res[type] = [tmp]
      }
      return res
    }, {})
    // return console.log(tmp)
    const tasks = Object.entries(tmp).map(([type, tmp]) => getUpdateBudgetMethod(type)(tmp))
    const res = await Promise.all(tasks)
    res.forEach(item => toast.success(item.msg))
    emit('refresh')
    done()
  }
  catch (error) {
    console.error(error)
  }
  finally {
    loading.value = false
  }
}
</script>
