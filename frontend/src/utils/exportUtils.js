/**
 * Shared CSV/PDF Export Utility for Reports
 */

/** Export data as a CSV file download */
export function exportCSV(filename, columns, rows) {
  const headers = columns.map((c) => `"${c.header}"`).join(',')
  const body = rows
    .map((row) =>
      columns.map((c) => {
        const val = c.csv ? c.csv(row) : row[c.key] ?? ''
        return `"${String(val).replace(/"/g, '""')}"`
      }).join(',')
    )
    .join('\n')

  const blob = new Blob([`${headers}\n${body}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/** Export data as a simple HTML-to-print PDF */
export function exportPDF(title, columns, rows) {
  const headers = columns.map((c) => `<th style="padding:8px 12px;border-bottom:2px solid #eee;text-align:left;font-size:11px;text-transform:uppercase;color:#666;">${c.header}</th>`).join('')
  const bodyRows = rows
    .map((row) => {
      const cells = columns
        .map((c) => {
          const val = c.csv ? c.csv(row) : row[c.key] ?? ''
          return `<td style="padding:7px 12px;border-bottom:1px solid #f0f0f0;font-size:12px;">${val}</td>`
        })
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')

  const html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Inter, sans-serif; padding: 24px; color: #111; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          p { color: #666; font-size: 12px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <table>
          <thead><tr>${headers}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </body>
    </html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 250)
  }
}
