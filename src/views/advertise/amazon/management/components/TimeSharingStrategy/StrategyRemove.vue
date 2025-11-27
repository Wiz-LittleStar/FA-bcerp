<template>
  <FaModal v-model="modalShow" :title="title" show-cancel-button :confirm-button-loading="loading" :before-close="submit">
    <el-form ref="formRef" :model="data" label-width="auto">
      <el-form-item label="策略类型" prop="type" :rules="requiredRule">
        <el-radio-group v-model="data.type">
          <el-radio v-for="item in timeSharingTypeOptions" :key="item.value" :label="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
  </FaModal>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import type { AdjustType } from '@/utils/hooks/useAmazonAdsUtils'
import { cloneDeep } from 'es-toolkit'
import { TIME_SHARING_TYPE } from '@/utils/enum/advertise'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'

const props = withDefaults(defineProps<{
  include?: AdjustType[]
}>(), {
  include: () => [],
})
const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const { include } = toRefs(props)

const timeSharingTypeOptions = computed(() => TIME_SHARING_TYPE.getOptions().filter(item => include.value.includes(item.value)))

function initForm(): {
  show: boolean
  info: ObjectAny[]
  data: ObjectAny
} {
  return {
    show: false,
    info: [],
    data: {
      type: timeSharingTypeOptions.value[0].value,
    },
  }
}
const form = reactive(initForm())
const { show: modalShow, info, data } = toRefs(form)
const title = computed(() => `移除分时策略`)

function reset() {
  Object.assign(form, initForm())
}

async function show(params: ObjectAny[] = []) {
  reset()
  info.value = cloneDeep(params)
  modalShow.value = true
}
defineExpose({ show })

const { requiredRule } = useFormRule()
const { request, loading } = useRequest()
const { removeTimeSharingStrategyMethod } = useAmazonAdsUtils()
const formRef = useTemplateRef<FormInstance>('formRef')
async function submit(action: 'confirm' | 'cancel' | 'close', done: () => void) {
  try {
    if (action !== 'confirm') {
      return done()
    }
    if (!await formRef.value?.validate()) {
      return
    }
    const { data: { type } } = toRaw(form)
    const adsObjIds = info.value?.filter(f => f.adjustType === type)?.map(f => f.id) || []
    if (adsObjIds?.length) {
      // return console.log(adsObjIds)
      const { msg } = await request(removeTimeSharingStrategyMethod(type), adsObjIds)
      toast.success(msg)
      emit('refresh')
      done()
    }
    else {
      toast.warning('未找到对应分时策略')
    }
  }
  catch (error) {
    console.error(error)
  }
}
</script>
