<i18n lang="json">
{
  "zh-cn": {
    "mobileLogin": "手机号登录",
    "sendCode": "发送验证码",
    "reSend": "重新发送",
    "accountLogin": "账号密码登录",
    "qrcodeLogin": "扫码登录",
    "intro": "欢迎使用 👋🏻",
    "remember": "记住我",
    "forget": "忘记密码了?",
    "noAccount": "还没有帐号?",
    "register": "注册新帐号",
    "wechatQrcode": "请使用微信扫码登录",
    "testLogin": "演示账号一键登录",
    "form": {
      "mobile": "手机号",
      "code": "验证码",
      "account": "用户名",
      "password": "密码",
      "login": "登录"
    },
    "rules": {
      "mobile": "请输入手机号",
      "code": "请输入验证码",
      "account": "请输入用户名",
      "password": "请输入密码"
    }
  },
  "zh-tw": {
    "mobileLogin": "手機號登入",
    "sendCode": "發送驗證碼",
    "reSend": "重新發送",
    "accountLogin": "帳號密碼登入",
    "qrcodeLogin": "掃碼登入",
    "intro": "歡迎使用 👋🏻",
    "remember": "記住我",
    "forget": "忘記密碼了?",
    "noAccount": "還沒有帳號?",
    "register": "註冊新帳號",
    "wechatQrcode": "請使用微信掃碼登入",
    "testLogin": "演示帳號一键登入",
    "form": {
      "mobile": "手機號",
      "code": "驗證碼",
      "account": "用戶名",
      "password": "密碼",
      "login": "登入"
    },
    "rules": {
      "mobile": "請輸入手機號",
      "code": "請輸入驗證碼",
      "account": "請輸入用戶名",
      "password": "請輸入密碼"
    }
  },
  "en": {
    "mobileLogin": "Phone Login",
    "sendCode": "Send Code",
    "reSend": "Re-send",
    "accountLogin": "Account Login",
    "qrcodeLogin": "Scan Login",
    "intro": "Welcome aboard 👋🏻",
    "remember": "Remember Me",
    "forget": "Forget Password?",
    "noAccount": "No Account?",
    "register": "Register New Account",
    "wechatQrcode": "Please use WeChat scan login",
    "testLogin": "Demo Account One-click Login",
    "form": {
      "mobile": "Phone",
      "code": "Code",
      "account": "Account",
      "password": "Password",
      "login": "Login"
    },
    "rules": {
      "mobile": "Please enter the mobile",
      "code": "Please enter the code",
      "account": "Please enter the account",
      "password": "Please enter the password"
    }
  }
}
</i18n>

<template>
  <div class="min-h-500px w-full flex-col-stretch-center p-12">
    <FaBlurReveal :delay="0.2" :duration="0.4" class="mb-6 space-y-2">
      <h3 class="text-4xl color-[var(--el-text-color-primary)] font-bold">
        {{ t('intro') }}
      </h3>
      <p class="text-sm text-muted-foreground lg:text-base">
        {{ title }}
      </p>
    </FaBlurReveal>
    <div class="mb-4">
      <FaTabs
        v-model="type" :list="[
          { label: t('mobileLogin'), value: 'mobile' },
          { label: t('accountLogin'), value: 'default' },
          // { label: t('qrcodeLogin'), value: 'qrcode' },
        ]" class="inline-flex"
      />
    </div>
    <div v-show="type === 'mobile'">
      <el-form>
        <el-form-item class="relative space-y-0">
          <FaInput v-model="form.mobile" type="text" :placeholder="t('form.mobile')" class="w-full" />
        </el-form-item>
        <el-form-item class="relative space-y-0">
          <FaInput v-model="form.code" type="text" :placeholder="t('form.code')" class="w-full" />
          <FaButton :loading="sendCodeLoading" variant="outline" class="absolute right-0 top-0" :disabled="sendCodeTimer > 0" @click="handleSendVerifyCode">
            {{ sendCodeTimer > 0 ? `${t('reSend')}(${sendCodeTimer})` : t('sendCode') }}
          </FaButton>
        </el-form-item>
        <el-form-item>
          <div class="w-full flex-center-between">
            <FaButton :loading="loading" size="lg" class="w-full" type="submit" @click="onPhoneSubmit">
              {{ t('form.login') }}
            </FaButton>
          </div>
        </el-form-item>
      </el-form>
    </div>
    <div v-show="type === 'default'">
      <el-form>
        <el-form-item class="relative space-y-0">
          <FaInput v-model="form.account" type="text" :placeholder="t('form.account')" class="w-full" />
        </el-form-item>
        <el-form-item class="relative space-y-0">
          <FaInput v-model="form.password" type="password" :placeholder="t('form.password')" class="w-full" />
        </el-form-item>
        <el-form-item>
          <div class="w-full flex-center-between">
            <FaCheckbox v-model="form.remember">
              {{ t('remember') }}
            </FaCheckbox>
          </div>
        </el-form-item>
      </el-form>
      <div>
        <FaButton :loading="loading" size="lg" class="w-full" type="submit" @click="onSubmit">
          {{ t('form.login') }}
        </FaButton>
      </div>
    </div>
    <div v-show="type === 'qrcode'">
      <div class="flex-col-center">
        <img src="https://s2.loli.net/2024/04/26/GsahtuIZ9XOg5jr.png" class="h-[250px] w-[250px]">
        <div class="mt-2 text-sm text-secondary-foreground op-50">
          {{ t('wechatQrcode') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { throttle } from 'es-toolkit'
import { toast } from 'vue-sonner'
import UserApi from '@/api/modules/user'

defineOptions({
  name: 'LoginForm',
})

const props = defineProps<{
  account?: string
}>()

const emits = defineEmits<{
  onLogin: [account?: string]
  onRegister: [account?: string]
  onResetPassword: [account?: string]
}>()

const { t } = useI18n()
const userStore = useUserStore()

const title = import.meta.env.VITE_APP_TITLE
const loading = ref(false)

// 登录方式，default 账号密码登录，qrcode 扫码登录
const type = ref<'mobile' | 'default' | 'qrcode'>('mobile')

const form = reactive({
  mobile: '',
  code: '',
  account: props.account ?? localStorage.getItem('login_account') ?? '',
  password: '',
  remember: localStorage.getItem('login_account') !== null,
})

async function onSubmit() {
  loading.value = true
  try {
    await userStore.login(form)
    toast.success('Success', {
      description: '登录成功',
    })
    if (form.remember) {
      localStorage.setItem('login_account', form.account)
    }
    else {
      localStorage.removeItem('login_account')
    }
    emits('onLogin', form.account)
  }
  finally {
    loading.value = false
  }
}

const sendCodeLoading = ref(false)
const sendCodeTimer = ref(0)
const startSendCodeTimer = throttle(() => {
  sendCodeTimer.value = 60
  setInterval(() => {
    if (sendCodeTimer.value > 0) {
      sendCodeTimer.value--
    }
    else {
      stopSendCodeTimer()
    }
  }, 1000)
}, 1000)
function stopSendCodeTimer() {
  sendCodeTimer.value = 0
}
async function handleSendVerifyCode() {
  sendCodeLoading.value = true
  try {
    const mobile = form.mobile?.trim()
    if (mobile) {
      const { msg } = await UserApi.sendSmsCode({ mobile })
      toast.success('Success', {
        description: msg,
      })
      startSendCodeTimer()
    }
    else {
      toast.error('Error', {
        description: t('rules.mobile'),
      })
    }
  }
  finally {
    sendCodeLoading.value = false
  }
}
async function onPhoneSubmit() {
  loading.value = true
  try {
    await userStore.phoneLogin({ mobile: form.mobile, code: form.code })
    toast.success('Success', {
      description: '登录成功',
    })
    emits('onLogin')
  }
  finally {
    loading.value = false
  }
}
</script>
