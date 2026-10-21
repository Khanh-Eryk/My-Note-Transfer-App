import TurndownService from 'turndown'
import { htmlToLatex } from './latexConverter'

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
})

export interface ExportOptions {
  title: string
  author: string
  template: 'thesis' | 'paper' | 'standard'
}

/**
 * Downloads a string as a text file
 */
export function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Export document as Plain Text (.txt)
 */
export function exportToTxt(html: string, options: ExportOptions) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const plainText = doc.body.textContent || ''
  const cleanTitle = options.title.trim().replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_') || 'note'
  downloadFile(plainText, `${cleanTitle}.txt`, 'text/plain;charset=utf-8')
}

/**
 * Export document as Markdown (.md)
 */
export function exportToMarkdown(html: string, options: ExportOptions) {
  const md = turndown.turndown(html)
  const cleanTitle = options.title.trim().replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_') || 'note'
  const header = `# ${options.title}\n*Tác giả: ${options.author}* - *Ngày: ${new Date().toLocaleDateString('vi-VN')}*\n\n---\n\n`
  downloadFile(header + md, `${cleanTitle}.md`, 'text/markdown;charset=utf-8')
}

/**
 * Export document as LaTeX (.tex)
 */
export function exportToLatex(html: string, options: ExportOptions) {
  const texCode = htmlToLatex(html, {
    title: options.title,
    author: options.author,
    template: options.template,
  })
  const cleanTitle = options.title.trim().replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_') || 'document'
  downloadFile(texCode, `${cleanTitle}.tex`, 'application/x-tex;charset=utf-8')
}

/**
 * Export document as PDF
 */
export async function exportToPdf(elementId: string, options: ExportOptions) {
  const element = document.getElementById(elementId)
  if (!element) return

  const html2pdfModule = await import('html2pdf.js')
  const html2pdf = (html2pdfModule as any).default || html2pdfModule

  const cleanTitle = options.title.trim().replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_') || 'document'

  const opt = {
    margin: [15, 15, 15, 15] as [number, number, number, number],
    filename: `${cleanTitle}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }

  html2pdf().set(opt).from(element).save()
}
