<template>
  <FaModal v-model="modalShow" :title="title" :before-close="submit">
    <el-form ref="formRef" v-loading="loading" :model="data" label-width="auto">
      <el-form-item label="菜单名称" prop="name" :rules="requiredRule">
        <el-input v-model="data.name" clearable :disabled="view" />
      </el-form-item>
      <el-form-item label="菜单类型" prop="type" :rules="requiredRule">
        <el-select v-model="data.type" filterable :disabled="view">
          <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="菜单标识" prop="controlId" :rules="requiredRule">
        <el-input v-model="data.controlId" clearable :disabled="view" />
      </el-form-item>
      <el-form-item v-show="root" label="系统标识" prop="resourceId" v-bind="{ ...(root && { rules: requiredRule }) }">
        <el-input v-model="data.resourceId" clearable :disabled="view" />
      </el-form-item>
    </el-form>
  </FaModal>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import { cloneDeep } from 'es-toolkit'
import { authzFunctionsGet, authzFunctionsPost, authzFunctionsPut } from '@/api/modules/system'

const emit = defineEmits(['refresh'])

const { request, loading } = useRequest()

const typeOptions = [
  { value: 0, label: '菜单' },
  { value: 1, label: '按钮' },
]

interface Data {
  pid?: number
  id?: number
  name?: string
  type?: typeof typeOptions[number]['value']
  controlId?: string
  resourceId?: string
}

function initForm(): {
  modalShow: boolean
  view: boolean
  info: Data
  data: Data
} {
  return {
    modalShow: false,
    view: false,
    info: {},
    data: {},
  }
}
const form = reactive(initForm())
const { modalShow, view, info, data } = toRefs(form)

const addMode = computed(() => !info.value.id)
const title = computed(() => `${info.value.name ?? ''}【${(view.value ? '查看' : addMode.value ? '新增子级' : '编辑')}】`)
const root = computed(() => !addMode.value && info.value.pid === -1)

const { requiredRule } = useFormRule()
const formRef = useTemplateRef<FormInstance>('formRef')
async function submit(action: 'confirm' | 'cancel' | 'close', done: () => void) {
  try {
    if (view.value || action !== 'confirm') {
      return done()
    }
    if (!await formRef.value?.validate()) {
      return
    }
    const { pid, resourceId } = info.value
    const tmp = {
      ...data.value,
      ...(addMode.value && {
        pid,
        resourceId,
      }),
    }
    const { msg } = await (addMode.value ? authzFunctionsPost : authzFunctionsPut)(tmp)
    toast.success(msg)
    emit('refresh', pid)
    done()
  }
  catch (error) {
    console.error(error)
  }
}

async function getDetail() {
  try {
    const { id } = info.value
    if (!id) { return }
    const { data: detail } = await request(authzFunctionsGet(id))
    data.value = isObject(detail) ? cloneDeep(detail) : {}
  }
  catch (error) {
    console.error(error)
  }
}

function reset() {
  Object.assign(form, initForm())
}
function show(params = {}, handle?: () => void) {
  reset()
  handle && handle()
  info.value = cloneDeep(isObject(params) ? params : {})
  if (!addMode.value) { getDetail() }
  modalShow.value = true
}
function preview(params = {}) {
  show(params, () => { view.value = true })
}
defineExpose({ show, preview })
</script>
