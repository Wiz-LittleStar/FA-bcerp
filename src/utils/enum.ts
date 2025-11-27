/**
 * 提供高性能、类型安全的枚举定义和操作方法
 */

// 基础枚举类型：简单的 key-value 映射
export type BaseEnum = Record<string, string | number>

// 枚举项类型
export interface EnumItem<T> {
  label: keyof T
  value: T[keyof T]
}

// 枚举增强类型
export interface EnumUtils<T extends BaseEnum> {
  /** 获取描述文本 */
  getLabel: (key: keyof T) => string
  /** 根据值获取描述文本 */
  getLabelByValue: (value: T[keyof T]) => string
  /** 获取所有选项数据 */
  getOptions: () => EnumItem<T>[]
  /** 获取键值映射 */
  getMapping: () => Record<string | number, string>
  /** 检查是否为有效的枚举值 */
  isValidValue: (value: unknown) => value is T[keyof T]
  /** 检查是否为有效的枚举键 */
  isValidKey: (key: unknown) => key is keyof T
  /** 获取枚举定义 */
  getEnum: () => T
}

// 完整的枚举对象类型
export type EnumObject<T extends BaseEnum> = T & EnumUtils<T>

/**
 * 创建增强的枚举对象
 * @param enumDef 枚举定义对象 { key: value, ... }
 * @param labels 标签映射对象 { key: label, ... }
 * @returns 增强的枚举对象
 */
export function createEnum<T extends BaseEnum>(
  enumDef: T,
  labels: Record<keyof T, string>,
): EnumObject<T> {
  // 预计算映射关系，避免运行时计算
  const valueToLabelMap = new Map<string | number, string>()
  const valueToKeyMap = new Map<string | number, keyof T>()
  const validValues = new Set<string | number>()
  const validKeys = new Set<string | number | symbol>()

  // 构建映射关系
  for (const [key, value] of Object.entries(enumDef)) {
    const label = labels[key as keyof T]
    valueToLabelMap.set(value, label)
    valueToKeyMap.set(value, key as keyof T)
    validValues.add(value)
    validKeys.add(key)
  }

  // 预计算选项数据
  const options = Object.entries(enumDef).map(([key, value]) => ({
    label: labels[key as keyof T],
    value: value as T[keyof T],
  }))

  // 预计算映射对象
  const mapping: Record<string | number, string> = {}
  for (const [value, label] of valueToLabelMap.entries()) {
    mapping[value] = label
  }

  // 工具方法
  const utils: EnumUtils<T> = {
    getLabel: (key: keyof T) => labels[key] || '',

    getLabelByValue: (value: T[keyof T]) => valueToLabelMap.get(value) || '',

    getOptions: () => options,

    getMapping: () => mapping,

    isValidValue: (value: unknown): value is T[keyof T] =>
      validValues.has(value as string | number),

    isValidKey: (key: unknown): key is keyof T =>
      validKeys.has(key as string | number | symbol),

    getEnum: () => enumDef,
  }

  // 返回合并对象
  return Object.assign({}, enumDef, utils) as EnumObject<T>
}

/**
 * 直接从带标签的对象创建枚举
 * @param enumWithLabels 包含值和标签的对象 { KEY: [value, label], ... }
 * @returns 增强的枚举对象
 */
export function defineEnum<
  T extends Record<string, [string | number, string]>,
>(enumWithLabels: T): EnumObject<{ [K in keyof T]: T[K][0] }> {
  const enumDef = {} as { [K in keyof T]: T[K][0] }
  const labels = {} as Record<keyof T, string>

  // 提取值和标签
  for (const [key, [value, label]] of Object.entries(enumWithLabels)) {
    enumDef[key as keyof T] = value as T[keyof T][0]
    labels[key as keyof T] = label
  }

  return createEnum(enumDef, labels)
}

/**
 * 从简单对象快速创建枚举（值作为键，标签作为值）
 * @param labelMap 标签映射 { value: label, ... }
 * @returns 增强的枚举对象
 */
export function fromLabels<K extends string | number>(
  labelMap: Record<K, string>,
): EnumObject<Record<K, K>> {
  const enumDef = {} as Record<K, K>
  const labels = {} as Record<K, string>

  for (const [value, label] of Object.entries(labelMap)) {
    const key = value as K
    enumDef[key] = key
    labels[key] = label as string
  }

  return createEnum(enumDef, labels)
}
