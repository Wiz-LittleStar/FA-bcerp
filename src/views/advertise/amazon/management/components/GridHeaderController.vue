<template>
  <FaModal v-model="modalShow" title="表头配置" class="h-90vh max-w-3xl">
    <div class="flex flex-col gap-4">
      <div class="flex-h-auto">
        <vxe-grid :data="dataList" v-bind="gridOptions">
          <template #color="{ row }">
            <el-color-picker v-model="row.color" size="small" show-alpha />
          </template>
          <template #operationHeader>
            <div class="flex-center-start gap-2">
              <span>操作</span>
              <el-button link type="warning" size="small" @click="resetAllColumn">
                全部重置
              </el-button>
            </div>
          </template>
          <template #operation="{ row }">
            <el-button link type="warning" size="small" @click="resetColumn(row)">
              重置
            </el-button>
          </template>
        </vxe-grid>
      </div>
    </div>
  </FaModal>
</template>

<script setup lang="ts">
import type { VxeGridProps } from 'vxe-table'
import { cloneDeep } from 'es-toolkit'

const props = withDefaults(defineProps<{
  storageKey?: string
  columns?: VxeGridProps['columns']
  defaultColor?: string
}>(), {
  storageKey: '',
  columns: () => [],
  defaultColor: '#606266',
})

const { storageKey, columns, defaultColor } = toRefs(props)

const modalShow = ref(false)

const dataList = ref<ObjectAny[]>([])
const StoreKey = 'AmazonAdsManagementGridHeaderSetting'
const { getStore, setStore } = useUtils()
function initDataList(columns: VxeGridProps['columns'] = []) {
  try {
    const storageData = getStore(StoreKey)[storageKey.value] ?? {}
    const availableColumns = cloneDeep(Array.isArray(columns) ? columns : []).filter(({ field, type }) => !!field && !['seq', 'checkbox', 'expand'].includes(type as string))
    dataList.value = availableColumns.map((item: ObjectAny) => ({
      ...item,
      color: storageData[item.field] || defaultColor.value,
    }))
  }
  catch (error) {
    console.error(error)
    dataList.value = []
  }
}
watch(columns, initDataList, { immediate: true, deep: true })
watch(dataList, (newVal) => {
  if (storageKey.value) {
    setStore(StoreKey, {
      [storageKey.value]: newVal.reduce((acc, { field, color }) => {
        acc[field] = color
        return acc
      }, {}),
    })
  }
}, { deep: true })

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
    keyField: 'field',
  },
  columns: [
    { field: 'title', title: '列' },
    { field: 'color', title: '颜色', slots: { default: 'color' } },
    { slots: { header: 'operationHeader', default: 'operation' } },
  ],
})

function resetAllColumn() {
  dataList.value.forEach((item: ObjectAny) => {
    item.color = defaultColor.value
  })
}
function resetColumn(row: ObjectAny) {
  row.color = defaultColor.value
}

function show() {
  modalShow.value = true
}
function getColumnColor(field?: string) {
  return dataList.value.find(item => item.field === field)?.color ?? defaultColor.value
}
defineExpose({ show, getColumnColor })
</script>
