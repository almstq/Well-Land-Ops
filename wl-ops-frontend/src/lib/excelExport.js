import * as XLSX from 'xlsx';

/**
 * Export any array of objects to an Excel file.
 * @param {Array} data - Array of flat objects
 * @param {string} sheetName - Worksheet name
 * @param {string} filename - Output filename (without .xlsx)
 */
export function exportToExcel(data, sheetName = 'Sheet1', filename = 'export') {
  if (!data || !data.length) return;

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));

  // Auto column widths
  const cols = Object.keys(data[0]).map(key => ({
    wch: Math.min(40, Math.max(key.length, 10)),
  }));
  ws['!cols'] = cols;

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Export multiple sheets to one workbook.
 * @param {Array<{name: string, data: Array}>} sheets
 * @param {string} filename
 */
export function exportMultiSheet(sheets, filename = 'wl-ops-export') {
  const wb = XLSX.utils.book_new();
  for (const { name, data } of sheets) {
    if (!data?.length) continue;
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  }
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
