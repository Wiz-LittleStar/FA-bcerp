<template>
  <FaModal v-model="modalShow" :title="title" :footer="false" class="max-w-6xl">
    <div class="h-80vh">
      <vxe-grid :loading="loading" :data="dataList" v-bind="gridOptions">
        <template #toolbarButtons>
          <div class="flex-center-start gap-2">
            <el-date-picker
              v-model="search.dateList" type="daterange" range-separator="至" start-placeholder="开始日期"
              end-placeholder="结束日期" value-format="YYYY-MM-DD HH:mm:ss" size="small" @change="getData()"
            />
            <el-button size="small" :loading="exportLoading" @click="exportExcel()">
              <template #icon>
                <FaIcon name="i-ep:download" />
              </template>
              导出
            </el-button>
          </div>
        </template>
        <template #exposureTimeDistribution="{ row }">
          <TimeRule v-model="row.timeRule" />
        </template>
      </vxe-grid>
    </div>
  </FaModal>
</template>

<script setup lang="ts">
import type { VxeGridProps } from 'vxe-table'
import { cloneDeep } from 'es-toolkit'
import { toast } from 'vue-sonner'
import { amazonAdsCampaignBudgetAnalysis } from '@/api/modules/advertise/amazon'
import dayjs from '@/utils/dayjs'
import TimeRule from './TimeRule.vue'

function initForm(): {
  show: boolean
  info: ObjectAny
} {
  return {
    show: false,
    info: {},
  }
}
const form = reactive(initForm())
const { show: modalShow, info } = toRefs(form)
const title = computed(() => `预算分析`)

const defaultSort: { field: string, order: 'desc' | 'asc' } = {
  field: 'date',
  order: 'desc',
}
function initSearch() {
  return {
    dateList: [],
  }
}
const search = reactive(initSearch())
const { request, loading } = useRequest()
const dataList = ref<ObjectAny[]>([])
const queryParams = computed(() => {
  const { adsType, campaignId, shopId } = info.value
  const { dateList } = toRaw(search)
  return {
    adsType,
    campaignId,
    dateList,
    shopId,
  }
})
const handleTimeValue = (value: number) => (value < 0) ? 0 : value
async function getData() {
  try {
    const { data } = await request(amazonAdsCampaignBudgetAnalysis, queryParams.value)
    dataList.value = Array.isArray(data)
      ? data.map((item) => {
          const exposures: ObjectAny[] = item.exposures ?? []
          return {
            ...item,
            timeRule: exposures?.map((m) => {
              const { startTime, endTime, exposureHour, exposureMinute, currencySymbol, cost, budget, impressions } = m
              return {
                startTime,
                endTime,
                content: `曝光时段：${startTime} - ${endTime}\n曝光时长：${handleTimeValue(exposureHour)}小时${handleTimeValue(exposureMinute)}分\n预算：${currencySymbol}${budget}\n花费：${currencySymbol}${cost}\n曝光量：${impressions}`,
              }
            }) || [],
          }
        })
      : []
  }
  catch (error) {
    console.error(error)
    dataList.value = []
  }
}

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
  sortConfig: {
    defaultSort,
  },
  toolbarConfig: {
    custom: true,
    slots: {
      buttons: 'toolbarButtons',
    },
  },
  scrollY: {
    enabled: true,
    gt: 20,
  },
  columns: [
    { field: 'date', title: '日期', sortable: true },
    { field: 'budget', title: '每日预算', titleSuffix: { content: '取当天你为广告活动设置过的最高预算' }, formatter: ({ cellValue, row }) => `${row.currencySymbol}${cellValue}` },
    { field: 'cost', title: '花费', formatter: ({ cellValue, row }) => `${row.currencySymbol}${cellValue}` },
    { field: 'impressions', title: '曝光量' },
    { field: 'exposureTime', title: '估算曝光时长', titleSuffix: { content: '当日多个预算时段的估算曝光时长和' }, formatter: ({ row }) => `${handleTimeValue(row.exposureHour)}小时${handleTimeValue(row.exposureMinute)}分` },
    { title: '曝光时长分布', titleSuffix: { content: '当日估算曝光时段的分布情况' }, slots: { default: 'exposureTimeDistribution' } },
  ],
})

const exportLoading = ref(false)
const { export_json_to_excel } = useFile()

/**
 * 格式化曝光时长分布信息
 */
function formatExposureTimeDistribution(timeRule: any[]): string {
  if (!Array.isArray(timeRule) || timeRule.length === 0) {
    return '-'
  }

  return timeRule.map((rule) => {
    const lines = rule.content?.split('\n') || []
    return lines.join('；')
  }).join(' | ')
}

/**
 * 导出 Excel
 */
async function exportExcel() {
  if (dataList.value.length === 0) {
    toast.warning('暂无数据可导出')
    return
  }

  exportLoading.value = true
  try {
    // 构建表头
    const header = [
      '日期',
      '每日预算',
      '花费',
      '曝光量',
      '估算曝光时长',
      '曝光时长分布',
    ]

    // 构建数据
    const data = dataList.value.map((row) => {
      const exposureTime = `${handleTimeValue(row.exposureHour)}小时${handleTimeValue(row.exposureMinute)}分`
      const exposureDistribution = formatExposureTimeDistribution(row.timeRule)

      return [
        row.date || '',
        `${row.currencySymbol || ''}${row.budget || 0}`,
        `${row.currencySymbol || ''}${row.cost || 0}`,
        row.impressions || 0,
        exposureTime,
        exposureDistribution,
      ]
    })

    // 生成文件名
    const campaignName = info.value.campaignName || '预算分析'
    const dateRange = search.dateList?.length === 2
      ? `${dayjs(search.dateList[0]).format('YYYYMMDD')}-${dayjs(search.dateList[1]).format('YYYYMMDD')}`
      : dayjs().format('YYYYMMDD')
    const filename = `${campaignName}_${dateRange}`

    // 导出
    export_json_to_excel({
      header,
      data,
      filename,
      sheetName: '预算分析',
    })

    toast.success('导出成功')
  }
  catch (error) {
    console.error('导出失败:', error)
    toast.error('导出失败，请重试')
  }
  finally {
    exportLoading.value = false
  }
}

function reset() {
  Object.assign(form, initForm())
}

const formateDate = (date: any) => dayjs(date).isValid() ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : undefined
async function show(params: ObjectAny = {}, defaultData?: ObjectAny) {
  reset()
  info.value = cloneDeep(params)
  const { dateList, ...rest } = defaultData ?? {}
  Object.assign(search, { ...rest, ...(dateList && { dateList: dateList.map((date: any) => formateDate(date)) }) })
  modalShow.value = true
  getData()
}
defineExpose({ show })
</script>
