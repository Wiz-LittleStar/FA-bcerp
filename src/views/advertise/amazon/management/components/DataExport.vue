<template>
  <FaModal v-model="modalShow" title="自定义导出" show-cancel-button :confirm-button-loading="loading" :before-close="submit" class="max-w-6xl">
    <div class="flex flex-col gap-2">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="报表类型">
          <span>{{ DATA_EXPORT_REPORT_TYPE.getLabelByValue(data.reportType) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="导出格式">
          <span>汇总导出</span>
        </el-descriptions-item>
      </el-descriptions>
      <div v-if="!selectDisable" class="flex items-end gap-2">
        <div class="fw-bold">
          全部字段
        </div>
        <el-button type="primary" link size="small" @click="toggleSelectAll()">
          {{ selectAll ? '取消全选' : '全选' }}
        </el-button>
      </div>
      <div v-if="selectDisable" class="fw-bold">
        将导出全部字段
      </div>
      <div class="h-60vh">
        <FaLayoutContainer class="static p-0" left-side-width="70%" left-side-class="of-y-auto">
          <template #leftSide>
            <div class="grid grid-cols-4 gap-2">
              <el-checkbox v-for="item in availableFields" :key="item.field" v-model="selectMap[item.field]">
                {{ item.title }}
              </el-checkbox>
            </div>
          </template>
          <div class="h-full flex flex-col gap-1">
            <div class="text-3 fw-bold">
              已选字段及展示顺序
            </div>
            <div class="flex-h-auto">
              <vxe-grid ref="gridRef" :data="data.columns" v-bind="gridOptions" v-on="gridEvents">
                <template #operation="{ row }">
                  <el-button type="danger" link size="small" @click="removeColumn(row.field)">
                    <template #icon>
                      <FaIcon name="i-ep:delete" />
                    </template>
                  </el-button>
                </template>
              </vxe-grid>
            </div>
          </div>
        </FaLayoutContainer>
      </div>
    </div>
  </FaModal>
</template>

<script setup lang="ts">
import type { VxeGridListeners, VxeGridProps } from 'vxe-table'
import { amazonAdsExportTaskCreateExportTask } from '@/api/modules/advertise/amazon'
import { useFaModal } from '@/ui/components/FaModal'
import { DATA_EXPORT_REPORT_TYPE } from '@/utils/enum/advertise'

const props = withDefaults(defineProps<{
  selectDisable?: boolean
}>(), {
  selectDisable: false,
})
const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const { selectDisable } = toRefs(props)

interface Form {
  show: boolean
  info: ObjectAny[]
  data: {
    queryParams: ObjectAny
    reportType: string
    columns: ObjectAny[]
  }
  selectMap: Record<string, boolean>
}
function initForm(): Form {
  return {
    show: false,
    info: [],
    data: {
      queryParams: {},
      reportType: DATA_EXPORT_REPORT_TYPE.AD_COMBINATION,
      columns: [],
    },
    selectMap: {},
  }
}
const form = reactive<Form>(initForm())
const { show: modalShow, info, data, selectMap } = toRefs(form)

const availableFields = computed(() => info.value.filter(item => (!!item.field && !['operation'].includes(item.field))))
const selectAll = computed(() => availableFields.value.every(item => !!selectMap.value[item.field]))

function toggleSelectAll(targetVal = !selectAll.value) {
  Object.assign(selectMap.value, availableFields.value.reduce((acc, item) => ({ ...acc, [item.field]: targetVal }), {}))
}

const gridRef = useTemplateRef('gridRef')
const gridOptions = reactive<VxeGridProps>({
  size: 'mini',
  height: 'auto',
  rowConfig: {
    drag: true,
  },
  columnConfig: {
    resizable: true,
    minWidth: 'auto',
  },
  columns: [
    { field: 'title', title: '字段', dragSort: true },
    { field: 'operation', title: '操作', slots: { default: 'operation' } },
  ],
})
const gridEvents = reactive<VxeGridListeners>({
  rowDragend: () => data.value.columns.splice(0, data.value.columns.length, ...gridRef.value!.getFullData()),
})
function removeColumn(field: string) {
  Object.assign(selectMap.value, { [field]: false })
}

const selectedFields = computed(() => availableFields.value.filter(item => !!selectMap.value[item.field]))
watch(selectedFields, (newVal) => {
  const newFields = newVal.filter(item => !data.value.columns.some(column => column.field === item.field))
  data.value.columns = [...data.value.columns.filter(item => newVal.some(field => field.field === item.field)), ...newFields]
}, { immediate: true, deep: true })

function resetForm() {
  Object.assign(form, initForm())
}
function show({ reportType, columns, queryParams }: { reportType: string, columns: ObjectAny[], queryParams: ObjectAny }) {
  resetForm()
  info.value = Array.isArray(columns) ? columns : []
  Object.assign(data.value, { reportType, queryParams })
  toggleSelectAll()
  modalShow.value = true
}
defineExpose({ show })

const { request, loading } = useRequest()
const router = useRouter()
async function submit(action: 'confirm' | 'cancel' | 'close', done: () => void) {
  try {
    if (action !== 'confirm') {
      return done()
    }
    const { queryParams, reportType, columns } = data.value
    const params = { ...queryParams, pageNum: -1, pageSize: -1 }
    const tmp = {
      reportType,
      columns: columns.map(item => item.field),
      ...([DATA_EXPORT_REPORT_TYPE.AD_COMBINATION, DATA_EXPORT_REPORT_TYPE.CAMPAIGN, DATA_EXPORT_REPORT_TYPE.AD_GROUP, DATA_EXPORT_REPORT_TYPE.AD_PRODUCT, DATA_EXPORT_REPORT_TYPE.TARGET, DATA_EXPORT_REPORT_TYPE.NEGATIVE_TARGET].includes(reportType) && { queryDTO: params }),
      ...([DATA_EXPORT_REPORT_TYPE.AD].includes(reportType) && { adDetailQueryDTO: params }),
      ...([DATA_EXPORT_REPORT_TYPE.AD_PLACEMENT].includes(reportType) && { campaignPlacementQueryPageDTO: params }),
      ...([DATA_EXPORT_REPORT_TYPE.SEARCH_TERM, DATA_EXPORT_REPORT_TYPE.KEYWORD_FREQUENCY].includes(reportType) && { searchTermDTO: params }),
      ...([DATA_EXPORT_REPORT_TYPE.ABA_SEARCH_TERM].includes(reportType) && { abaQueryDTO: params }),
    }
    const { msg } = await request(amazonAdsExportTaskCreateExportTask, tmp)
    useFaModal().confirm({
      title: msg,
      content: '是否跳转至导出任务列表？',
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      onConfirm: () => {
        emit('refresh')
        router.push({ name: 'advertise-amazon-export-task' })
        done()
      },
      onCancel: () => {
        emit('refresh')
        done()
      },
    })
  }
  catch (error) {
    console.error(error)
  }
}
</script>
