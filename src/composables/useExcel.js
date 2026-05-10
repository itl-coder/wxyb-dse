/**
 * Excel import/export/template composable using SheetJS (xlsx)
 */
import * as XLSX from 'xlsx'

/**
 * @typedef {Object} ColumnDef
 * @property {string} prop - data property key
 * @property {string} label - column header label
 * @property {number} [width] - column width in characters
 * @property {(val: any) => string} [transform] - optional value transform for export
 */

export function useExcel() {
  /**
   * Export data array to an .xlsx file and trigger download.
   * @param {Object[]} data
   * @param {ColumnDef[]} columns
   * @param {string} filename
   * @param {string} [sheetName='Sheet1']
   */
  function exportToExcel(data, columns, filename, sheetName = 'Sheet1') {
    const rows = data.map(row => {
      const obj = {}
      columns.forEach(col => {
        const val = row[col.prop]
        obj[col.label] = col.transform ? col.transform(val) : (val ?? '')
      })
      return obj
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    if (columns.some(c => c.width)) {
      ws['!cols'] = columns.map(c => ({ wch: c.width || 15 }))
    }

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, filename)
  }

  /**
   * Import data from an .xlsx/.xls file.
   * @param {File} file
   * @param {ColumnDef[]} columns
   * @returns {Promise<Object[]>}
   */
  function importFromExcel(file, columns) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: 'array' })
          const ws = wb.Sheets[wb.SheetNames[0]]
          const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })

          const labelToProp = {}
          columns.forEach(c => { labelToProp[c.label] = c.prop })

          const result = rows.map(row => {
            const obj = {}
            Object.entries(row).forEach(([key, val]) => {
              const prop = labelToProp[key]
              if (prop) obj[prop] = val
            })
            return obj
          }).filter(obj => Object.keys(obj).length > 0)
          resolve(result)
        } catch (err) {
          reject(new Error('Excel 文件解析失败: ' + err.message))
        }
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Download an empty template with header row only.
   * @param {ColumnDef[]} columns
   * @param {string} filename
   */
  function downloadTemplate(columns, filename) {
    const headerRow = {}
    columns.forEach(c => { headerRow[c.label] = '' })
    const ws = XLSX.utils.json_to_sheet([headerRow])
    if (columns.some(c => c.width)) {
      ws['!cols'] = columns.map(c => ({ wch: c.width || 15 }))
    }
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '导入模板')
    XLSX.writeFile(wb, filename)
  }

  return { exportToExcel, importFromExcel, downloadTemplate }
}
