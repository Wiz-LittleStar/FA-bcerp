<route lang="yaml">
meta:
  title: '导出任务'
</route>

<template>
  <div class="absolute size-full flex flex-col">
    <FaPageMain class="flex-h-auto" main-class="flex-h-auto flex flex-col gap-3">
      <FaSearchBar :show-toggle="false">
        <template #default>
          <el-form :model="search" size="small" inline-message inline>
            <el-form-item>
              <el-radio-group v-model="search.status" @change="getData()">
                <el-radio-button v-for="item in [{ value: undefined, label: '全部' }, ...DATA_EXPORT_TASK_STATUS.getOptions()]" :key="item.value" :value="item.value">
                  {{ item.label }}
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item>
              <el-select v-model="search.reportTypes" placeholder="报表类型" class="w-50" multiple collapse-tags filterable clearable @change="getData()">
                <el-option v-for="item in DATA_EXPORT_REPORT_TYPE.getOptions()" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-date-picker v-model="search.requestDateList" class="w-60" start-placeholder="请求时间" end-placeholder="请求时间" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss" @change="getData()" />
            </el-form-item>
            <el-form-item>
              <el-date-picker v-model="search.generateDateList" class="w-60" start-placeholder="生成时间" end-placeholder="生成时间" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss" @change="getData()" />
            </el-form-item>
            <el-form-item>
              <el-select v-model="search.createUserId" placeholder="创建人" class="w-50" filterable clearable @change="getData()">
                <el-option v-for="item in staffList" :key="item.id" :label="item.fullName" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="getData()">
                <template #icon>
                  <FaIcon name="i-ep:search" />
                </template>
                查询
              </el-button>
            </el-form-item>
          </el-form>
        </template>
      </FaSearchBar>
      <div class="flex-h-auto">
        <vxe-grid :loading="loading" :data="dataList" v-bind="gridOptions" v-on="gridEvents">
          <template #status="{ row }">
            <el-tag :type="tagTypeMap.dataExportTaskStatus[row.status]">
              {{ DATA_EXPORT_TASK_STATUS.getLabelByValue(row.status) }}
            </el-tag>
          </template>
          <template #operation="{ row }">
            <el-button type="primary" link size="small" :disabled="row.status !== DATA_EXPORT_TASK_STATUS.COMPLETED || !row.url" @click="download(row.url)">
              下载
            </el-button>
          </template>
        </vxe-grid>
      </div>
      <el-pagination :current-page="pagination.pageNum" :total="pagination.total" size="small" :page-size="pagination.pageSize" :page-sizes="pagination.sizes" :layout="pagination.layout" :hide-on-single-page="false" background @size-change="getData()" @current-change="getData()" />
    </FaPageMain>
  </div>
</template>

<script setup lang="ts">
import type { VxeGridListeners, VxeGridProps } from 'vxe-table'
import { amazonAdsExportTaskPage } from '@/api/modules/advertise/amazon'
import { DATA_EXPORT_REPORT_TYPE, DATA_EXPORT_TASK_STATUS } from '@/utils/enum/advertise'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'

const { staffList, getStaffList, setSort, openUrl } = useUtils()
const { tagTypeMap } = useAmazonAdsUtils()

interface Search {
  status: number
  reportTypes: string[]
  requestDateList: string[]
  generateDateList: string[]
  createUserId: number
  descColumns: string[]
}
const defaultSort: { field: string, order: 'desc' | 'asc' } = {
  field: 'requestTime',
  order: 'desc',
}
function initSearch() {
  const data = {}
  const { field, order } = defaultSort
  setSort({ prop: field, order }, data)
  return data
}
const search = reactive<Partial<Search>>(initSearch())
const { request, loading } = useRequest()
const dataList = ref<ObjectAny[]>([])
const { pagination } = usePagination()
const queryParams = computed(() => {
  const { pageNum, pageSize } = pagination.value
  return {
    ...search,
    pageNum,
    pageSize,
  }
})
async function getData() {
  try {
    const { data: { records = [], total: recordsTotal } } = await request(amazonAdsExportTaskPage, queryParams.value)
    dataList.value = Array.isArray(records) ? records : []
    pagination.value.total = recordsTotal ?? 0
  }
  catch (error) {
    console.error(error)
    dataList.value = []
  }
}
onMounted(() => {
  getStaffList()
  getData()
})

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
    keyField: 'id',
  },
  sortConfig: {
    remote: true,
    defaultSort,
  },
  scrollY: {
    enabled: true,
    gt: 20,
  },
  toolbarConfig: {
    custom: true,
    slots: {
      buttons: 'toolbarButtons',
    },
  },
  columns: [
    { field: 'id', title: '报表编号' },
    { field: 'reportType', title: '报表类型', formatter: ({ cellValue }) => DATA_EXPORT_REPORT_TYPE.getLabelByValue(cellValue) },
    { field: 'status', title: '状态', slots: { default: 'status' } },
    { field: 'generateTime', title: '生成时间', sortable: true },
    { field: 'requestTime', title: '请求时间', sortable: true },
    { field: 'createUserName', title: '创建人' },
    { title: '操作', slots: { default: 'operation' } },
  ],
})
const gridEvents = reactive<VxeGridListeners>({
  sortChange: ({ field, order }) => {
    setSort({ prop: field, order }, search)
    getData()
  },
})
function download(url: string) {
  if (url) {
    openUrl(import.meta.env.VITE_APP_OSS_ADDRESS + url)
  }
}
</script>
