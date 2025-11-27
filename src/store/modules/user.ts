import type { Settings } from '#/global'
import CryptoJS from 'crypto-js'
import { cloneDeep } from 'es-toolkit'
import apiUser from '@/api/modules/user'
import router from '@/router'
import settingsDefault from '@/settings'
import eventBus from '@/utils/eventBus'
import { diffTwoObj, mergeWithoutUndefinedProps } from '@/utils/object'

interface Permission {
  id: number
  pid: number
  name: string
  type: number
  sequence: number | null
  path: string | null
  controlId: string
  resourceId: string
  createUserId: number
  children: Permission[]
  isQuickMenu: boolean | null
  systemType: string | null
  pageName: string | null
  pname: string | null
}

function encrypt(word: string, keyStr: string = '1q2w3e4r%T^Y&U*I') {
  const key = CryptoJS.enc.Utf8.parse(keyStr)
  const srcs = CryptoJS.enc.Utf8.parse(word)
  const encrypted = CryptoJS.AES.encrypt(srcs, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
  return encrypted.toString()
}

export const useUserStore = defineStore(
  // 唯一ID
  'user',
  () => {
    const settingsStore = useSettingsStore()
    const tabbarStore = useTabbarStore()
    const routeStore = useRouteStore()
    const menuStore = useMenuStore()

    const account = ref(localStorage.getItem('account') ?? '')
    const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') ?? '{}'))
    const token = ref(localStorage.getItem('token') ?? '')
    const refreshToken = ref(localStorage.getItem('refreshToken') ?? '')
    const expireTime = ref(localStorage.getItem('expireTime') ?? '')
    const avatar = ref(localStorage.getItem('avatar') ?? '')
    const permissions = ref<Permission[]>([])
    const controlIds = computed(() => permissions.value.map(item => item.controlId))
    const isLogin = computed(() => {
      if (token.value) {
        return true
      }
      return false
    })

    function renderToken(data: {
      token_type: string
      access_token: string
    }) {
      return `${data.token_type} ${data.access_token}`
    }

    // 登录
    async function login(data: {
      account: string
      password: string
    }) {
      const tmp = {
        username: encrypt(data.account),
        password: encrypt(data.password),
      }
      const res = await apiUser.login(tmp)
      const newToken = renderToken(res.data)
      localStorage.setItem('account', res.data.username)
      localStorage.setItem('userInfo', JSON.stringify(res.data))
      localStorage.setItem('token', newToken)
      localStorage.setItem('refreshToken', res.data.refresh_token)
      localStorage.setItem('expireTime', res.data.expire_time)
      localStorage.setItem('avatar', res.data.avatar ?? '')
      account.value = res.data.username
      userInfo.value = res.data
      token.value = newToken
      refreshToken.value = res.data.refresh_token
      expireTime.value = res.data.expire_time
      avatar.value = res.data.avatar ?? ''
    }

    // 手机号登录
    async function phoneLogin(data: {
      mobile: string
      code: string
    }) {
      const res = await apiUser.loginBySms(data)
      const newToken = renderToken(res.data)
      localStorage.setItem('account', res.data.username)
      localStorage.setItem('userInfo', JSON.stringify(res.data))
      localStorage.setItem('token', newToken)
      localStorage.setItem('refreshToken', res.data.refresh_token)
      localStorage.setItem('expireTime', res.data.expire_time)
      localStorage.setItem('avatar', res.data.avatar ?? '')
      account.value = res.data.username
      userInfo.value = res.data
      token.value = newToken
      refreshToken.value = res.data.refresh_token
      expireTime.value = res.data.expire_time
      avatar.value = res.data.avatar ?? ''
    }

    // 手动登出
    function logout(redirect = router.currentRoute.value.fullPath) {
      localStorage.removeItem('token')
      token.value = ''
      router.push({
        name: 'login',
        query: {
          ...(redirect !== settingsStore.settings.home.fullPath && router.currentRoute.value.name !== 'login' && { redirect }),
        },
      }).then(logoutCleanStatus)
    }
    // 请求登出
    function requestLogout() {
      if (settingsStore.settings.app.loginExpiredMode === 'redirect' || !routeStore.isGenerate) {
        localStorage.removeItem('token')
        token.value = ''
        router.push({
          name: 'login',
          query: {
            ...(
              router.currentRoute.value.fullPath !== settingsStore.settings.home.fullPath
              && router.currentRoute.value.name !== 'login'
              && {
                redirect: router.currentRoute.value.fullPath,
              }
            ),
          },
        }).then(logoutCleanStatus)
      }
      else {
        // 此处仅清除 localStorage 中登录状态的变量，以保证在弹出登录窗口模式下页面展示依旧正常
        localStorage.removeItem('token')
        eventBus.emit('global-login-again-visible')
      }
    }
    // 登出后清除状态
    function logoutCleanStatus() {
      localStorage.removeItem('account')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('expireTime')
      localStorage.removeItem('avatar')
      account.value = ''
      userInfo.value = {}
      refreshToken.value = ''
      expireTime.value = ''
      avatar.value = ''
      permissions.value = []
      settingsStore.updateSettings({}, true)
      tabbarStore.clean()
      routeStore.removeRoutes()
      menuStore.setActived(0)
    }

    // 刷新 token
    async function tokenRefresh() {
      try {
        // 检查是否有refreshToken
        if (!refreshToken.value) {
          throw new Error('No refresh token available')
        }

        const params = { refresh_token: refreshToken.value }

        const response = await apiUser.refreshtoken(params)
        const res = response.data

        // 更新信息
        const newToken = renderToken(res)
        localStorage.setItem('account', res.username)
        localStorage.setItem('userInfo', JSON.stringify(res))
        localStorage.setItem('token', newToken)
        localStorage.setItem('refreshToken', res.refresh_token)
        localStorage.setItem('expireTime', res.expireTime)
        account.value = res.username
        userInfo.value = userInfo
        token.value = newToken
        refreshToken.value = res.refresh_token
        expireTime.value = res.expireTime
        return newToken
      }
      catch (error) {
        // 处理刷新失败的情况
        logout(location.hash.substring(1))
        throw error
      }
    }

    // 获取权限
    async function getPermissions() {
      const { data } = await apiUser.permission({ resourceIds: 'bcerp-server' })
      permissions.value = Array.isArray(data) ? data : []
    }

    // 修改密码
    async function editPassword(data: {
      password: string
      newPassword: string
    }) {
      await apiUser.passwordEdit(data)
    }

    // 框架已将可提供给用户配置的选项提取出来，请勿新增其他选项，不需要的选项可以在这里注释掉
    const preferences = ref<Settings.all>({
      app: {
        themeSync: settingsDefault.app.themeSync,
        colorScheme: settingsDefault.app.colorScheme,
        lightTheme: settingsDefault.app.lightTheme,
        darkTheme: settingsDefault.app.darkTheme,
        radius: settingsDefault.app.radius,
        enableColorAmblyopiaMode: settingsDefault.app.enableColorAmblyopiaMode,
        enableProgress: settingsDefault.app.enableProgress,
        defaultLang: settingsDefault.app.defaultLang,
      },
      menu: {
        mode: settingsDefault.menu.mode,
        style: settingsDefault.menu.style,
        enableDark: settingsDefault.menu.enableDark,
        mainMenuClickMode: settingsDefault.menu.mainMenuClickMode,
        subMenuUniqueOpened: settingsDefault.menu.subMenuUniqueOpened,
        subMenuCollapse: settingsDefault.menu.subMenuCollapse,
        subMenuAutoCollapse: settingsDefault.menu.subMenuAutoCollapse,
        enableSubMenuCollapseButton: settingsDefault.menu.enableSubMenuCollapseButton,
      },
      layout: {
        widthMode: settingsDefault.layout.widthMode,
        widthModeScope: settingsDefault.layout.widthModeScope,
      },
      mainPage: {
        enableTransition: settingsDefault.mainPage.enableTransition,
        transitionMode: settingsDefault.mainPage.transitionMode,
      },
      topbar: {
        mode: settingsDefault.topbar.mode,
        switchTabbarAndToolbar: settingsDefault.topbar.switchTabbarAndToolbar,
      },
      tabbar: {
        style: settingsDefault.tabbar.style,
        enableIcon: settingsDefault.tabbar.enableIcon,
        dblclickAction: settingsDefault.tabbar.dblclickAction,
        enableMemory: settingsDefault.tabbar.enableMemory,
      },
      toolbar: {
        breadcrumb: settingsDefault.toolbar.breadcrumb,
        navSearch: settingsDefault.toolbar.navSearch,
        fullscreen: settingsDefault.toolbar.fullscreen,
        pageReload: settingsDefault.toolbar.pageReload,
        colorScheme: settingsDefault.toolbar.colorScheme,
        layout: settingsDefault.toolbar.layout,
      },
      breadcrumb: {
        style: settingsDefault.breadcrumb.style,
        enableMainMenu: settingsDefault.breadcrumb.enableMainMenu,
      },
    })
    // isPreferencesUpdating 用于防止循环更新
    let isPreferencesUpdating = false
    watch(() => settingsStore.settings, (val) => {
      if (!settingsStore.settings.userPreferences.enable) {
        return
      }
      if (!isPreferencesUpdating) {
        isPreferencesUpdating = true
        preferences.value = mergeWithoutUndefinedProps(val, preferences.value)
      }
      else {
        isPreferencesUpdating = false
      }
    }, {
      deep: true,
    })
    watch(preferences, (val) => {
      if (!settingsStore.settings.userPreferences.enable) {
        return
      }
      if (!isPreferencesUpdating) {
        isPreferencesUpdating = true
        settingsStore.updateSettings(cloneDeep(val))
      }
      else {
        isPreferencesUpdating = false
      }
      updatePreferences(cloneDeep(val))
    }, {
      deep: true,
    })
    // isPreferencesInited 用于防止初始化时触发更新
    let isPreferencesInited = false
    // 获取偏好设置
    async function getPreferences() {
      let data: Settings.all = {}
      if (settingsStore.settings.userPreferences.storageTo === 'local') {
        if (localStorage.has('userPreferences')) {
          data = JSON.parse(localStorage.getItem('userPreferences') as string)[account.value] || {}
        }
      }
      else if (settingsStore.settings.userPreferences.storageTo === 'server') {
        const res = await apiUser.preferences()
        data = JSON.parse(res.data.preferences || '{}') as Settings.all
      }
      preferences.value = mergeWithoutUndefinedProps(data, preferences.value)
    }
    // 更新偏好设置
    async function updatePreferences(data: Settings.all = {}) {
      if (!isPreferencesInited) {
        isPreferencesInited = true
        return
      }
      if (!isLogin.value) {
        return
      }
      data = diffTwoObj(settingsDefault, data)
      if (settingsStore.settings.userPreferences.storageTo === 'local') {
        const userPreferencesData = localStorage.has('userPreferences') ? JSON.parse(localStorage.getItem('userPreferences') as string) : {}
        userPreferencesData[account.value] = data
        localStorage.setItem('userPreferences', JSON.stringify(userPreferencesData))
      }
      else if (settingsStore.settings.userPreferences.storageTo === 'server') {
        await apiUser.preferencesEdit(JSON.stringify(data))
      }
    }

    return {
      account,
      userInfo,
      token,
      refreshToken,
      expireTime,
      avatar,
      permissions,
      controlIds,
      isLogin,
      login,
      phoneLogin,
      tokenRefresh,
      logout,
      requestLogout,
      getPermissions,
      editPassword,
      preferences,
      getPreferences,
      updatePreferences,
    }
  },
)
