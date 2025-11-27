<template>
  <div class="w-full flex-center-start gap-2">
    <template v-if="adjustBudget">
      <div class="flex-w-auto flex-center-start">
        <el-select v-if="!adjustBudgetPercent" v-model="data.adjustType" :size="size" class="flex-w-auto" :disabled="disabled">
          <el-option v-for="item in TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.getOptions()" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-input-number v-model="data.adjustValue" class="flex-w-auto" :size="size" controls-position="right" :min="0.01" :step="0.01" :precision="2" :disabled="disabled">
          <template v-if="adjustBudgetPercent" #suffix>
            %
          </template>
        </el-input-number>
      </div>
      <div v-if="!adjustBudgetPercent && priceRangeType" class="flex-w-auto flex-center-start">
        <el-button :size="size">
          预算{{ priceRangeType }}
        </el-button>
        <el-input-number v-model="data.budgetRange" class="flex-w-auto" :size="size" controls-position="right" :min="0.01" :step="0.01" :precision="2" :disabled="disabled" />
      </div>
    </template>
    <template v-else-if="adjustStatus">
      <el-select v-model="data.adjustState" :size="size" class="flex-w-auto" :disabled="disabled">
        <el-option v-for="item in TIME_SHARING_STRATEGY_STATE.getOptions()" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </template>
    <template v-else-if="adjustPosition">
      <div class="flex-w-auto flex-center-start flex-wrap gap-2 align-start" :class="{ 'flex-col': props.column }">
        <div class="flex-center-start gap-1">
          <div :class="{ 'flex-w-auto': props.column }">
            搜索结果顶部（首页）
          </div>
          <el-input-number v-model="data.topOfSearchOnAmazon" class="flex-w-auto" :size="size" controls-position="right" :min="0" :step="1" :precision="0" clearable :disabled="disabled">
            <template #suffix>
              %
            </template>
          </el-input-number>
        </div>
        <div class="flex-center-start gap-1">
          <div :class="{ 'flex-w-auto': props.column }">
            商品页面
          </div>
          <el-input-number v-model="data.detailPageOnAmazon" class="flex-w-auto" :size="size" controls-position="right" :min="0" :step="1" :precision="0" clearable :disabled="disabled">
            <template #suffix>
              %
            </template>
          </el-input-number>
        </div>
        <div class="flex-center-start gap-1">
          <div :class="{ 'flex-w-auto': props.column }">
            搜索结果其余位置
          </div>
          <el-input-number v-model="data.otherOnAmazon" class="flex-w-auto" :size="size" controls-position="right" :min="0" :step="1" :precision="0" clearable :disabled="disabled">
            <template #suffix>
              %
            </template>
          </el-input-number>
        </div>
      </div>
    </template>
    <template v-else-if="adjustBid">
      <div class="flex-w-auto flex-center-start">
        <el-select v-model="data.adjustType" :size="size" class="flex-w-auto" :disabled="disabled">
          <el-option v-for="item in TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.getOptions()" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-input-number v-model="data.adjustValue" class="flex-w-auto" :size="size" controls-position="right" :min="0.01" :step="0.01" :precision="2" :disabled="disabled" />
      </div>
      <div class="flex-w-auto flex-center-start">
        <template v-if="priceRangeType">
          <el-button :size="size">
            竞价{{ priceRangeType }}
          </el-button>
          <el-input-number v-model="data.bidRange" class="flex-w-auto" :size="size" controls-position="right" :min="0.01" :step="0.01" :precision="2" :disabled="disabled" />
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { AdjustType } from '@/utils/hooks/useAmazonAdsUtils'
import { TIME_SHARING_STRATEGY_STATE, TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE, TIME_SHARING_TYPE } from '@/utils/enum/advertise'

const props = withDefaults(defineProps<{
  size?: 'small' | 'default' | 'large'
  adjustType?: AdjustType
  disabled?: boolean
  column?: boolean
}>(), {
  size: 'small',
  disabled: false,
  column: false,
})

// 分时调预算
const adjustBudget = computed(() => [TIME_SHARING_TYPE.BUDGET, TIME_SHARING_TYPE.BUDGET_PERCENT].includes(props.adjustType!))
// 分时启停
const adjustStatus = computed(() => props.adjustType === TIME_SHARING_TYPE.STATE)
// 分时调广告位
const adjustPosition = computed(() => props.adjustType === TIME_SHARING_TYPE.PLACEMENT)
// 分时调竞价
const adjustBid = computed(() => props.adjustType === TIME_SHARING_TYPE.BID)
// 分时预算/按百分比分配
const adjustBudgetPercent = computed(() => props.adjustType === TIME_SHARING_TYPE.BUDGET_PERCENT)

const data = defineModel<ObjectAny>('modelValue', { required: true })
const priceRangeType = computed(() => {
  const { adjustType } = data.value ?? {}
  if ([TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.UP, TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.UP_PERCENT].includes(adjustType)) {
    return '上限'
  }
  else if ([TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.DOWN, TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.DOWN_PERCENT].includes(adjustType)) {
    return '下限'
  }
  return ''
})
</script>
