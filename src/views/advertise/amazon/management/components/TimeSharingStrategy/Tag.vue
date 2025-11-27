<template>
  <el-popover v-if="existTimeSharingStrategy" trigger="click" v-bind="{ ...(adjustByTime && { width: '80vw' }) }">
    <div class="flex flex-col gap-2">
      <div class="c-blue fw-bold">
        {{ title }}
      </div>
      <div class="w-full">
        <vxe-grid v-if="adjustByTime" :data="tableData" v-bind="gridOptions">
          <template #header>
            <div class="flex-center-start gap-2">
              <div class="w-100">
                站点时间
              </div>
              <template v-if="isAdjustBudget">
                <div class="w-150">
                  {{ adjustTypeLabel }}
                </div>
                <div class="flex-w-auto">
                  预调整(示例：{{ inAdvanceValue }})
                </div>
                <div class="flex-w-auto">
                  时段增加预算
                </div>
              </template>
              <div v-else-if="isAdjustState || isAdjustPlacement" class="flex-w-auto">
                {{ adjustTypeLabel }}
              </div>
              <template v-else-if="isAdjustBid">
                <div class="w-150">
                  {{ adjustTypeLabel }}
                </div>
                <div class="flex-w-auto">
                  预调整(示例：{{ inAdvanceValue }})
                </div>
              </template>
            </div>
          </template>
          <template #default="{ row }">
            <div
              v-for="(item, index) in row.timeRanges"
              :key="item.id"
              class="flex-center-start gap-2"
              :class="{ 'mt-1': index }"
            >
              <!-- 站点时间 -->
              <div class="w-100 flex-center-start gap-5">
                <el-time-select
                  v-model="item.startTime"
                  placeholder="起始时间"
                  :picker-options="{
                    start: '00:00',
                    step: '01:00',
                    end: '24:00',
                    maxTime: item.endTime,
                  }"
                  size="small"
                  disabled
                />
                <span>-</span>
                <el-time-select
                  v-model="item.endTime"
                  placeholder="结束时间"
                  :picker-options="{
                    start: '00:00',
                    step: '01:00',
                    end: '24:00',
                    minTime: item.startTime,
                  }"
                  size="small"
                  disabled
                />
              </div>
              <template v-if="isAdjustBudget">
                <!-- 预算 -->
                <div class="w-150">
                  <StrategyEdit
                    v-model="item.setting"
                    :adjust-type="adjustType"
                    disabled
                  />
                </div>
                <!-- 预调整 -->
                <StrategyEditResult
                  v-model="item.setting"
                  :adjust-type="adjustType"
                  class="flex-w-auto"
                  :in-advance-value="inAdvanceValue"
                />
                <!-- 时段增加预算 -->
                <div class="flex-w-auto">
                  <span>{{ priceEditFluctuation([adjustType, item.setting, row.timeRanges[index
                    - 1]?.setting, inAdvanceValue]) }}</span>
                </div>
              </template>
              <template v-else-if="isAdjustState || isAdjustPlacement">
                <div class="flex-w-auto">
                  <StrategyEdit
                    v-model="item.setting"
                    :adjust-type="adjustType"
                  />
                </div>
              </template>
              <template v-else-if="isAdjustBid">
                <div class="w-150">
                  <StrategyEdit
                    v-model="item.setting"
                    :adjust-type="adjustType"
                  />
                </div>
                <!-- 预调整 -->
                <StrategyEditResult
                  v-model="item.setting"
                  :adjust-type="adjustType"
                  class="flex-w-auto"
                  :in-advance-value="inAdvanceValue"
                />
              </template>
            </div>
          </template>
        </vxe-grid>
        <div v-else-if="adjustByPerformance">
          <div><span class="fw-bold">生效时间</span>：{{ performance.startTime }} - {{ performance.endTime }}</div>
          <div v-if="performance.isPositive">
            <div class="fw-bold">
              效果好加大投入
            </div>
            <div class="flex-center-start flex-wrap">
              <div class="fw-bold">
                执行条件：
              </div>
              <div>{{ TIME_SHARING_STRATEGY_POSITIVE_EFFECT_TYPE.getLabelByValue(performance.positiveEffectType) }}</div>
              <template v-if="performance.positiveEffectType === TIME_SHARING_STRATEGY_POSITIVE_EFFECT_TYPE.AVAILABLE">
                <div>{{ TIME_SHARING_STRATEGY_SYMBOL_TYPE.getLabelByValue(performance.positiveEffectSymbol) }}</div>
                <div>{{ performance.positiveEffectValue }}%</div>
              </template>
              <div>时，且当日广告表现不错（满足以下条件）</div>
            </div>
            <div>{{ performance.positiveEffectCriteria?.map((item: ObjectAny) => `${TIME_SHARING_STRATEGY_EFFECT_CRITERIA_TYPE.getLabelByValue(item.effectCriteriaType)} ${TIME_SHARING_STRATEGY_SYMBOL_TYPE.getLabelByValue(item.symbolType)} ${item.effectValue}`).join(' 且 ') || '-' }}</div>
            <div class="flex-center-start gap-5">
              <div class="fw-bold">
                调整预算：
              </div>
              <div>{{ TIME_SHARING_POSITIVE_EFFECT_BUDGET_TYPE.getLabelByValue(performance.positiveEffectBudgetType) }}</div>
              <div>{{ performance.positiveEffectBudgetValue }}</div>
              <div>{{ performance.positiveEffectBudgetType === TIME_SHARING_POSITIVE_EFFECT_BUDGET_TYPE.PERCENT ? '%' : '' }}</div>
              <div>最大不超过</div>
              <div>{{ performance.positiveEffectBudgetLimit ?? '-' }}</div>
            </div>
          </div>
          <div v-if="performance.isNegative">
            <div class="fw-bold">
              效果差及时止损
            </div>
            <div class="flex-center-start flex-wrap">
              <div class="fw-bold">
                执行条件：
              </div>
              <div>{{ TIME_SHARING_STRATEGY_NEGATIVE_EFFECT_TYPE.getLabelByValue(performance.negativeEffectType) }}</div>
              <div>时，且当日广告表现不错（满足以下条件）</div>
            </div>
            <div>{{ performance.negativeEffectCriteria?.map((item: ObjectAny) => `${TIME_SHARING_STRATEGY_EFFECT_CRITERIA_TYPE.getLabelByValue(item.effectCriteriaType)} ${TIME_SHARING_STRATEGY_SYMBOL_TYPE.getLabelByValue(item.symbolType)} ${item.effectValue}`).join(' 且 ') || '-' }}</div>
            <div class="flex-center-start gap-5">
              <div class="fw-bold">
                调整预算：
              </div>
              <div>直接将每日预算设置为当前广告花费。</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <template #reference>
      <el-tag size="small" :type="type" v-bind="$attrs" class="cursor-pointer">
        分时
      </el-tag>
    </template>
  </el-popover>
</template>

<script setup lang="ts">
import type { VxeGridProps } from 'vxe-table'
import { TIME_SHARING_ADJUST_FREQUENCY, TIME_SHARING_ADJUST_TYPE, TIME_SHARING_POSITIVE_EFFECT_BUDGET_TYPE, TIME_SHARING_STRATEGY_EFFECT_CRITERIA_TYPE, TIME_SHARING_STRATEGY_NEGATIVE_EFFECT_TYPE, TIME_SHARING_STRATEGY_POSITIVE_EFFECT_TYPE, TIME_SHARING_STRATEGY_STATUS, TIME_SHARING_STRATEGY_SYMBOL_TYPE, TIME_SHARING_STRATEGY_VIEW_TYPE, TIME_SHARING_TYPE } from '@/utils/enum/advertise'
import useAmazonAdsTimeSharingStrategyUtils from '@/utils/hooks/useAmazonAdsTimeSharingStrategyUtils'
import StrategyEdit from './StrategyEdit.vue'
import StrategyEditResult from './StrategyEditResult.vue'

const props = withDefaults(defineProps<{
  data?: ObjectAny
  adjustType: number
  inAdvanceValue?: number
}>(), {
  value: () => ({}),
  inAdvanceValue: 20,
})
const { data, adjustType, inAdvanceValue } = toRefs(props)

const isAdjustBudget = computed(() => [TIME_SHARING_TYPE.BUDGET, TIME_SHARING_TYPE.BUDGET_PERCENT].includes(adjustType.value))
const isAdjustState = computed(() => adjustType.value === TIME_SHARING_TYPE.STATE)
const isAdjustPlacement = computed(() => adjustType.value === TIME_SHARING_TYPE.PLACEMENT)
const isAdjustBid = computed(() => adjustType.value === TIME_SHARING_TYPE.BID)
const isAdjustBudgetPercent = computed(() => adjustType.value === TIME_SHARING_TYPE.BUDGET_PERCENT)

const strategyInfo = computed(() => {
  const { adsAdjustsDetail, adsAdjustStateDetail, adsAdjustPlacementDetail } = data.value ?? {}
  if (isAdjustBudget.value || isAdjustBid.value) { return adsAdjustsDetail ?? {} }
  if (isAdjustState.value) { return adsAdjustStateDetail ?? {} }
  if (isAdjustPlacement.value) { return adsAdjustPlacementDetail ?? {} }
  return {}
})

const title = computed(() => [TIME_SHARING_TYPE.getLabelByValue(adjustType.value), TIME_SHARING_ADJUST_TYPE.getLabelByValue(strategyInfo.value.adjustType)].filter(Boolean).join(' - '))
const adjustTypeLabel = computed(() => title.value?.replace(/^(分时调|分时)/, ''))

const adjustByTime = computed(() => strategyInfo.value?.adjustType === TIME_SHARING_ADJUST_TYPE.TIME)
const adjustByPerformance = computed(() => strategyInfo.value?.adjustType === TIME_SHARING_ADJUST_TYPE.PERFORMANCE)
const adjustFrequencyWeekly = computed(() => strategyInfo.value?.adjustFrequency === TIME_SHARING_ADJUST_FREQUENCY.WEEK)

const performance = computed(() => strategyInfo.value?.performance ?? {})

const { initStrategyTimes, validateTimeStrategy, generateTimeKeys, getExchangeTableData, priceEditFluctuation } = useAmazonAdsTimeSharingStrategyUtils()
const strategyTimes = computed(() => {
  const { strategyTimes } = strategyInfo.value ?? {}
  const result = initStrategyTimes()
  if (Array.isArray(strategyTimes)) {
    strategyTimes.forEach((item) => {
      if (validateTimeStrategy(item, props.adjustType)) {
        const { adjustType, adjustValue, budgetRange, bidRange, dayOfWeek, adjustState, startTime, endTime, topOfSearchOnAmazon, detailPageOnAmazon, otherOnAmazon } = item
        const tmp = {
          ...(isAdjustBudget.value && {
            adjustValue,
            ...(!isAdjustBudgetPercent.value && {
              adjustType,
              budgetRange,
            }),
          }),
          ...(isAdjustState.value && {
            adjustState,
          }),
          ...(isAdjustPlacement.value && {
            topOfSearchOnAmazon,
            detailPageOnAmazon,
            otherOnAmazon,
          }),
          ...(isAdjustBid.value && {
            adjustType,
            adjustValue,
            bidRange,
          }),
        }
        if (startTime && endTime) {
          const keys = generateTimeKeys(startTime, endTime)
          if (dayOfWeek) {
            const cur = result.find(f => f.dayOfWeek === dayOfWeek)
            if (cur) {
              keys.forEach((key) => {
                Object.assign(cur, { [key]: tmp })
              })
            }
          }
          else {
            result.forEach((f) => {
              keys.forEach((key) => {
                Object.assign(f, { [key]: tmp })
              })
            })
          }
        }
      }
    })
  }
  return result
})

const tableData = computed(() => adjustByTime.value ? getExchangeTableData({ strategyTimes: strategyTimes.value, adjustType: adjustType.value }, TIME_SHARING_STRATEGY_VIEW_TYPE.LIST).slice(0, adjustFrequencyWeekly.value ? undefined : 1) : [])

const existTimeSharingStrategy = computed(() => (adjustByTime.value && !!tableData.value?.length) || adjustByPerformance.value)

const type = computed(() => strategyInfo.value?.status === TIME_SHARING_STRATEGY_STATUS.ENABLED ? 'primary' : 'info')

const gridOptions = reactive<VxeGridProps>({
  size: 'mini',
  height: 'auto',
  columnConfig: {
    resizable: true,
  },
  rowConfig: {
    isCurrent: true,
    isHover: true,
  },
  scrollY: {
    enabled: true,
    gt: 20,
  },
  columns: [
    { field: 'name', title: '日期', width: 70, formatter: ({ cellValue }) => adjustFrequencyWeekly.value ? cellValue : '每天' },
    { slots: { header: 'header', default: 'default' } },
  ],
})
</script>
