import type { BookType, WorkBook, WorkSheet } from 'xlsx'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

// 类型定义
interface ExportExcelOptions {
  multiHeader?: any[][]
  header?: any[]
  data?: any[][]
  filename?: string
  merges?: string[]
  autoWidth?: boolean
  bookType?: BookType
  sheetName?: string
}

interface ColumnWidth {
  wch: number
}

export default function useFile() {
  /**
   * 计算单个单元格的宽度
   * @param val 单元格的值
   * @returns 列宽配置对象
   */
  function calculateCellWidth(val: any): ColumnWidth {
    if (val == null) {
      return { wch: 10 }
    }

    const stringValue = val.toString()
    // 检查是否包含中文字符
    const hasChinese = /[\u4E00-\u9FA5]/.test(stringValue)

    if (hasChinese) {
      // 中文字符占用更多宽度
      const chineseCount = (stringValue.match(/[\u4E00-\u9FA5]/g) || []).length
      const otherCount = stringValue.length - chineseCount
      return { wch: chineseCount * 2 + otherCount }
    }

    return { wch: Math.max(stringValue.length, 10) }
  }

  /**
   * 计算所有列的最大宽度
   * @param data 二维数组数据
   * @returns 列宽配置数组
   */
  function calculateColumnWidths(data: any[][]): ColumnWidth[] {
    if (data.length === 0) {
      return []
    }

    const colWidths: ColumnWidth[] = []
    const maxCols = Math.max(...data.map(row => row.length))

    for (let col = 0; col < maxCols; col++) {
      let maxWidth = 10
      for (const row of data) {
        if (row[col] !== undefined) {
          const cellWidth = calculateCellWidth(row[col])
          maxWidth = Math.max(maxWidth, cellWidth.wch)
        }
      }
      // 限制最大宽度为50
      colWidths.push({ wch: Math.min(maxWidth, 50) })
    }

    return colWidths
  }

  /**
   * 导出 JSON 数据为 Excel 文件
   * @param options 导出配置选项
   */
  function export_json_to_excel(options: ExportExcelOptions = {}): void {
    const {
      multiHeader = [],
      header = [],
      data = [],
      filename = 'excel-list',
      merges = [],
      autoWidth = true,
      bookType = 'xlsx',
      sheetName = 'Sheet1',
    } = options

    try {
      // 构建完整的数据数组
      const fullData: any[][] = [
        ...multiHeader,
        header,
        ...data,
      ]

      // 使用 XLSX 内置方法创建工作表（更高效）
      const ws: WorkSheet = XLSX.utils.aoa_to_sheet(fullData)

      // 处理合并单元格
      if (merges.length > 0) {
        ws['!merges'] = merges.map(merge => XLSX.utils.decode_range(merge))
      }

      // 设置列宽
      if (autoWidth) {
        ws['!cols'] = calculateColumnWidths(fullData)
      }

      // 创建工作簿
      const wb: WorkBook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, sheetName)

      // 导出文件
      const wbout = XLSX.write(wb, {
        bookType,
        bookSST: false,
        type: 'array',
      })

      saveAs(
        new Blob([wbout], { type: 'application/octet-stream' }),
        `${filename}.${bookType}`,
      )
    }
    catch (error) {
      console.error('导出 Excel 失败:', error)
      throw new Error('导出 Excel 文件时发生错误')
    }
  }

  return {
    export_json_to_excel,
  }
}
