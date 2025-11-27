import api from '../index'

export default {
  // 登录
  login: (data: {
    username: string
    password: string
  }) => api.post('authz/oauth/login', data),

  // 刷新 token
  refreshtoken: (data: {
    refresh_token: string
  }) => api.post('authz/oauth/token', data, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }),

  // 发送短信验证码
  sendSmsCode: (data: {
    mobile: string
  }) => api.post('authz/oauth/sendSmsCode', data),

  // 短信登录
  loginBySms: (data: {
    mobile: string
    code: string
  }) => api.post('authz/oauth/loginBySms', data),

  // 获取权限
  permission: (params: {
    resourceIds: string
  }) => api.get('authz/functions/resource', {
    params,
  }),

  // 修改密码
  passwordEdit: (data: {
    password: string
    newPassword: string
  }) => api.post('user/password/edit', data, {
    baseURL: '/mock/',
  }),

  // 获取偏好设置
  preferences: () => api.get('user/preferences', {
    baseURL: '/mock/',
  }),

  // 修改偏好设置
  preferencesEdit: (preferences: string) => api.post('user/preferences/edit', {
    preferences,
  }, {
    baseURL: '/mock/',
  }),

  // 获取标签栏固定标签页数据
  tabbar: () => api.get('user/tabbar', {
    baseURL: '/mock/',
  }),

  // 修改标签栏固定标签页数据
  tabbarEdit: (tabbar: string) => api.post('user/tabbar/edit', {
    tabbar,
  }, {
    baseURL: '/mock/',
  }),

  // 获取收藏夹
  favorites: () => api.get('user/favorites', {
    baseURL: '/mock/',
  }),

  // 修改收藏夹
  favoritesEdit: (favorites: string) => api.post('user/favorites/edit', {
    favorites,
  }, {
    baseURL: '/mock/',
  }),
}
