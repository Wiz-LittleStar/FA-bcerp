import type { Menu } from '#/global'

const menu: Menu.recordMainRaw = {
  meta: {
    title: '系统',
    icon: 'i-tdesign:system-setting-filled',
    auth: '/base',
  },
  children: [
    {
      meta: {
        title: '权限管理',
        auth: '/basic/authority',
      },
      children: [
        {
          path: '/system/auth/menu',
          meta: {
            title: '菜单管理',
            auth: '/system/authority/MenuManagement',
          },
        },
      ],
    },
  ],
}

export default menu
