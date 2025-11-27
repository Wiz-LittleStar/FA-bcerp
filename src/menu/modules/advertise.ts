import type { Menu } from '#/global'

const menu: Menu.recordMainRaw = {
  meta: {
    title: '广告',
    icon: 'i-ri:advertisement-fill',
    auth: '/advertise',
  },
  children: [
    {
      meta: {
        title: 'Amazon',
        auth: '/advertise/amazon',
      },
      children: [
        {
          path: '/advertise/amazon/dashboard',
          meta: {
            title: '广告看板',
            auth: '/advertise/amazon/advertiseDashboard',
          },
        },
        {
          path: '/advertise/amazon/management',
          meta: {
            title: '广告管理',
            auth: '/advertise/amazon/AdvertiseMangement/PageIndex',
          },
        },
        {
          path: '/advertise/amazon/export-task',
          meta: {
            title: '导出任务',
            auth: '/advertise/amazon/ExportTask',
          },
        },
        {
          path: '/advertise/amazon/indirect-order',
          meta: {
            title: '广告间接订单',
            auth: '/advertise/amazon/IndirectOrder',
          },
        },
      ],
    },
  ],
}

export default menu
