<route lang="yaml">
meta:
  title: '菜单管理'
</route>

<template>
  <div class="absolute size-full flex flex-col">
    <div class="relative flex-h-auto flex flex-col overflow-auto">
      <FaLayoutContainer hide-left-side-toggle class="static" left-side-class="h-full flex flex-col gap-4" default-class="size-full">
        <template #leftSide>
          <el-button-group class="w-full flex items-center">
            <el-button type="primary" class="flex-w-auto">
              菜单管理
            </el-button>
            <el-button @click="getMenuList()">
              <template #icon>
                <FaIcon name="i-ep:refresh" />
              </template>
            </el-button>
          </el-button-group>
          <el-scrollbar class="flex-h-auto">
            <el-tree v-loading="loading" :data="menu" node-key="id" :default-expanded-keys="defaultExpandedKeys" @node-click="handleNodeClick" @node-expand="handleNodeExpand">
              <template #default="{ data }">
                <div class="w-full flex-center-between gap-4 pr-4">
                  <div class="flex-w-auto flex items-center" :title="data.name">
                    <FaIcon v-if="data.icon" :name="data.icon" class="size-4" style="margin-inline-end: 5px;" />
                    <div class="flex-w-auto truncate">
                      {{ data.name }}
                    </div>
                  </div>
                  <FaDropdown :items="commandOptions(data)" @click.stop />
                </div>
              </template>
            </el-tree>
          </el-scrollbar>
        </template>
        <RoleList v-model="currentMenuId" />
      </FaLayoutContainer>
    </div>
    <EditMenu ref="editMenuRef" @refresh="getMenuList" />
  </div>
</template>

<script setup lang="ts">
import { ElLoading, ElMessageBox } from 'element-plus'
import { authzFunctionsDelete, authzFunctionsTree } from '@/api/modules/system'
import EditMenu from './components/EditMenu.vue'
import RoleList from './components/RoleList.vue'

const { request, loading } = useRequest()

interface TreeData {
  id: number
  pid: number
  name: string
  title: string
  checked: boolean
  open: boolean
  parent: boolean
  resourceId: string
  icon: string
  state: number
  children?: TreeData[]
}

const menu = ref<TreeData[]>([])
const defaultExpandedKeys = ref<number[]>([])
function renderThreeData(data: TreeData[], pid: number) {
  return Array.isArray(data)
    ? data.reduce((res: TreeData[], item) => {
        if (item.pid === pid) {
          const children = renderThreeData(data, item.id)
          res.push({ ...item, ...(children.length && { children }) })
        }
        return res
      }, [])
    : []
}

async function getMenuList(expandKey?: number) {
  try {
    if (expandKey !== undefined) {
      defaultExpandedKeys.value = [expandKey]
    }
    const { data } = await request(authzFunctionsTree)
    menu.value = renderThreeData(data, -1)
  }
  catch (error) {
    console.error(error)
  }
}
onMounted(() => {
  getMenuList()
})

const currentMenuId = ref<number | undefined>(undefined)
function handleNodeClick(data: TreeData) {
  const { id } = data
  currentMenuId.value = id
}
function handleNodeExpand(data: TreeData) {
  const { id } = data
  defaultExpandedKeys.value = [id]
}

const { auth } = useAuth()
const editMenuRef = useTemplateRef<typeof EditMenu>('editMenuRef')
function commandOptions(data: TreeData) {
  return [
    [
      {
        label: '查看',
        icon: 'i-ep:view',
        handle: () => { editMenuRef.value?.preview(data) },
      },
      {
        label: '新增',
        icon: 'i-ep:plus',
        hide: !auth('/system/authority/MenuManagement/add'),
        handle: () => {
          const { id, ...rest } = data
          editMenuRef.value?.show({ ...rest, pid: id })
        },
      },
      {
        label: '编辑',
        icon: 'i-ep:edit',
        hide: !auth('/system/authority/MenuManagement/edit'),
        handle: () => { editMenuRef.value?.show(data) },
      },
      {
        label: '删除',
        icon: 'i-ep:delete',
        hide: !(data.pid !== -1 && auth('/system/authority/MenuManagement/del')),
        handle: () => {
          const { pid, id, name } = data
          ElMessageBox.confirm(
            `确定删除菜单【${name}】吗？`,
            '提示',
            {
              confirmButtonText: '确认',
              cancelButtonText: '取消',
              type: 'warning',
            },
          ).then(async () => {
            const loading = ElLoading.service({
              lock: true,
              text: 'Loading',
              background: 'rgba(0, 0, 0, 0.7)',
            })
            try {
              const { msg } = await authzFunctionsDelete(id)()
              toast.success(msg)
              getMenuList(pid)
            }
            catch (error) {
              console.error(error)
            }
            finally {
              loading.close()
            }
          })
        },
      },
    ],
  ]
}
</script>
