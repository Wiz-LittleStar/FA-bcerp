import type { FormItemRule } from 'element-plus'

export default function useFormRule() {
  const requiredRule: FormItemRule = {
    required: true,
    message: '请输入',
    trigger: ['blur', 'change'],
  }

  return {
    requiredRule,
  }
}
