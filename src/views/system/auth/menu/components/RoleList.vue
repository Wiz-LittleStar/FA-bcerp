<template>
  <el-table v-loading="loading" :data="dataList" table-layout="auto" border class="size-full">
    <el-table-column label="角色名称" prop="name" />
    <el-table-column label="备注" prop="note" />
    <el-table-column label="创建日期" prop="createTime" />
  </el-table>
</template>

<script setup lang="ts">
import { authzRolesFunctionsGet } from '@/api/modules/system'

const model = defineModel<number>()

const { request, loading } = useRequest()
const dataList = ref<ObjectAny[]>([])

async function getList() {
  try {
    if (model.value === undefined) { return }
    const { data } = await request(authzRolesFunctionsGet(model.value))
    dataList.value = Array.isArray(data) ? data : []
  }
  catch (error) {
    console.error(error)
    dataList.value = []
  }
}

watch(model, () => getList())
</script>
