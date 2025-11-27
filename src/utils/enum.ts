/**
 * 提供高性能、类型安全的枚举定义和操作方法
 */

// 基础枚举类型：简单的 key-value 映射
export type BaseEnum = Record<string, string | number>

// 枚举项类型
/**
 * 表示枚举项的通用接口
 * @template T 枚举类型
 * @property {keyof T} label 枚举项的标签/键名
 * @property {T[keyof T]} value 枚举项的值
 */
export interface EnumItem<T> {
  label: keyof T
  value: T[keyof T]
}

// 枚举增强类型
/**
 * 枚举工具接口，提供对枚举类型的各种操作方法
 * @template T 继承自BaseEnum的枚举类型
 */
/**
 * 根据枚举键获取对应的描述文本
 * @param {keyof T} key - 枚举键
 * @returns {string} 对应的描述文本
 */
/**
 * 根据枚举值获取对应的描述文本
 * @param {T[keyof T]} value - 枚举值
 * @returns {string} 对应的描述文本
 */
/**
 * 获取枚举的所有选项数据
 * @returns {EnumItem<T>[]} 包含所有枚举选项的数组
 */
/**
 * 获取枚举的键值映射
 * @returns {Record<string | number, string>} 键值映射对象
 */
/**
 * 检查是否为有效的枚举值
 * @param {unknown} value - 待检查的值
 * @returns {value is T[keyof T]} 如果是有效枚举值则返回true
 */
/**
 * 检查是否为有效的枚举键
 * @param {unknown} key - 待检查的键
 * @returns {key is keyof T} 如果是有效枚举键则返回true
 */
/**
 * 获取原始的枚举定义
 * @returns {T} 原始的枚举对象
 */
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
/**
 * 定义一个枚举对象的类型，该类型结合了基础枚举类型和枚举工具类型
 * @template T 基础枚举类型，必须继承自 BaseEnum
 * @typedef {T & EnumUtils<T>} EnumObject
 */
export type EnumObject<T extends BaseEnum> = T & EnumUtils<T>

/**
 * 创建带有工具方法的枚举对象
 * @template T 枚举类型，必须继承自 BaseEnum
 * @param {T} enumDef 枚举定义对象，包含键值对
 * @param {Record<keyof T, string>} labels 枚举键对应的标签映射
 * @returns {EnumObject<T>} 合并了原始枚举定义和工具方法的枚举对象
 * @property {function(key: keyof T): string} getLabel 根据键获取标签
 * @property {function(value: T[keyof T]): string} getLabelByValue 根据值获取标签
 * @property {function(): Array<{label: string, value: T[keyof T]}>} getOptions 获取选项数组
 * @property {function(): Record<string | number, string>} getMapping 获取值到标签的映射
 * @property {function(value: unknown): value is T[keyof T]} isValidValue 检查值是否有效
 * @property {function(key: unknown): key is keyof T} isValidKey 检查键是否有效
 * @property {function(): T} getEnum 获取原始枚举定义
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
 * 定义一个带有标签的枚举对象
 * @template T - 枚举类型，键为枚举名，值为[枚举值, 显示标签]的元组
 * @param {T} enumWithLabels - 包含枚举值和对应标签的对象
 * @returns {EnumObject<{[K in keyof T]: T[K][0]}>} 创建的枚举对象，包含值和标签
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
 * 根据标签映射创建枚举对象
 * @template K - 枚举键的类型，可以是字符串或数字
 * @param {Record<K, string>} labelMap - 键值对映射，键为枚举值，值为对应的显示标签
 * @returns {EnumObject<Record<K, K>>} 返回创建的枚举对象，包含值和标签
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
