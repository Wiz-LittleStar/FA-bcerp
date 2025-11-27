import type { RecursiveRequired, Settings } from '#/global'
import { cloneDeep } from 'es-toolkit'
import settingsDefault from '@/settings.default'
import { merge } from '@/utils/object'

const globalSettings: Settings.all = {
  // 请在此处编写或粘贴配置代码
  app: {
    lightTheme: 'orange',
    darkTheme: 'orange',
    enablePermission: true,
    enableDynamicTitle: true,
    enableFeedback: true,
    enableErrorLog: true,
    enableCheckUpdates: true,
    routeBaseOn: 'filesystem',
  },
  userPreferences: {
    enable: true,
  },
  layout: {
    enableMobileAdaptation: true,
  },
  menu: {
    style: 'dot',
    enableSubMenuCollapseButton: true,
    enableHotkeys: true,
    mode: 'only-side',
  },
  topbar: {
    mode: 'fixed',
  },
  tabbar: {
    enable: true,
    style: 'fashion',
    enableIcon: true,
    enableHotkeys: true,
    enableMemory: true,
  },
  toolbar: {
    favorites: true,
    notification: true,
    i18n: true,
    fullscreen: true,
    pageReload: true,
    colorScheme: true,
  },
  breadcrumb: {
    style: 'modern',
    enableMainMenu: true,
  },
  mainPage: {
    enableHotkeys: true,
    iframeCacheMax: 9,
    transitionMode: 'slide-right',
  },
  copyright: {
    enable: false,
  },
}

export default merge(globalSettings, cloneDeep(settingsDefault)) as RecursiveRequired<Settings.all>
