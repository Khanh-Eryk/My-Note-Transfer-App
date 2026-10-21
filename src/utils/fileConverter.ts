import mammoth from 'mammoth'
import TurndownService from 'turndown'
import { htmlToLatex } from './latexConverter'
import { downloadFile } from './exportManager'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as pdfjsLib from 'pdfjs-dist'

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })

export type SupportedFormat = 'docx' | 'doc' | 'pdf' | 'md' | 'txt' | 'latex' | 'html' | 'png' | 'jpg'

export interface ParsedDocument {
  html: string
  text: string
  images?: string[]
}

/**
 * Parses and extracts complete, styled content from uploaded files
 */
export async function parseUploadedFile(file: File): Promise<ParsedDocument> {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''

  if (ext === 'docx' || ext === 'doc') {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.convertToHtml({ arrayBuffer })
    let html = result.value || ''

    if (!html.trim()) {
      const rawTextResult = await mammoth.extractRawText({ arrayBuffer })
      const raw = rawTextResult.value || ''
      html = raw
        .split('\n')
        .filter((l: string) => l.trim())
        .map((l: string) => `<p>${l}</p>`)
        .join('')
    }

    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    const text = tempDiv.textContent || tempDiv.innerText || ''
    return { html, text }
  }

  if (ext === 'pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      let fullText = ''

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .join(' ')
        fullText += pageText + '\n\n'
      }

      const cleanText = fullText.trim()
      const html = cleanText
        .split('\n\n')
        .filter((p) => p.trim())
        .map((p) => `<p>${p}</p>`)
        .join('')

      return { html, text: cleanText }
    } catch (err) {
      console.error('PDF parsing error', err)
      const raw = await file.text().catch(() => '')
      return { html: `<p>${raw}</p>`, text: raw }
    }
  }

  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp') {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        const html = `<div style="text-align: center; margin: 20px 0;"><img src="${dataUrl}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 6px;" /></div>`
        resolve({ html, text: `[Hình ảnh: ${file.name}]`, images: [dataUrl] })
      }
      reader.readAsDataURL(file)
    })
  }

  // Text, Markdown, HTML, LaTeX fallback
  const rawText = (await file.text()).normalize('NFC')

  if (ext === 'md') {
    const html = rawText
      .split('\n\n')
      .map((block) => {
        const b = block.trim()
        if (b.startsWith('# ')) return `<h1>${b.substring(2)}</h1>`
        if (b.startsWith('## ')) return `<h2>${b.substring(3)}</h2>`
        if (b.startsWith('### ')) return `<h3>${b.substring(4)}</h3>`
        if (b.startsWith('- ') || b.startsWith('* ')) {
          const items = b
            .split('\n')
            .map((li) => `<li>${li.replace(/^[-*]\s+/, '')}</li>`)
            .join('')
          return `<ul>${items}</ul>`
        }
        return `<p>${b}</p>`
      })
      .join('')
    return { html, text: rawText }
  }

  if (ext === 'html' || ext === 'htm') {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = rawText
    const text = tempDiv.textContent || tempDiv.innerText || ''
    return { html: rawText, text }
  }

  // Standard Plain text (.txt)
  const html = rawText
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()
      return trimmed ? `<p>${trimmed}</p>` : '<br/>'
    })
    .join('')
  return { html, text: rawText }
}

/**
 * Universal file format conversion with 100% visible render assurance (no blank pages)
 */
export async function convertAndDownload(
  file: File,
  targetFormat: SupportedFormat
): Promise<void> {
  const baseName = file.name.replace(/\.[^/.]+$/, '')
  const parsed = await parseUploadedFile(file)

  switch (targetFormat) {
    case 'txt': {
      downloadFile(parsed.text || 'Tài liệu không có nội dung', `${baseName}.txt`, 'text/plain;charset=utf-8')
      break
    }
    case 'md': {
      const md = turndown.turndown(parsed.html || `<p>${parsed.text}</p>`)
      downloadFile(md, `${baseName}.md`, 'text/markdown;charset=utf-8')
      break
    }
    case 'latex': {
      const tex = htmlToLatex(parsed.html || `<p>${parsed.text}</p>`, {
        title: baseName,
        author: 'NoteMaster Converter',
        template: 'standard',
      })
      downloadFile(tex, `${baseName}.tex`, 'application/x-tex;charset=utf-8')
      break
    }
    case 'html': {
      const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>${baseName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Times New Roman", serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #111827; line-height: 1.6; }
    h1 { font-size: 24px; font-weight: bold; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 24px; }
    h2 { font-size: 20px; font-weight: bold; margin-top: 20px; }
    p { margin: 12px 0; }
    img { max-width: 100%; height: auto; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #d1d5db; padding: 8px 12px; }
  </style>
</head>
<body>
  <h1>${baseName}</h1>
  ${parsed.html}
</body>
</html>`
      downloadFile(fullHtml, `${baseName}.html`, 'text/html;charset=utf-8')
      break
    }
    case 'pdf': {
      // Create a visible styled container on DOM to ensure html2canvas can measure layout and render accurately
      const container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.top = '0'
      container.style.left = '0'
      container.style.width = '794px' // Exact A4 pixel width at 96 DPI
      container.style.minHeight = '1123px' // Exact A4 pixel height
      container.style.backgroundColor = '#ffffff'
      container.style.color = '#111827'
      container.style.padding = '48px 56px'
      container.style.fontFamily = '"Times New Roman", Times, serif'
      container.style.fontSize = '14px'
      container.style.lineHeight = '1.6'
      container.style.zIndex = '-9999'
      container.style.opacity = '1'
      container.style.pointerEvents = 'none'

      container.innerHTML = `
        <div style="margin-bottom: 24px; border-bottom: 1.5px solid #d1d5db; padding-bottom: 12px;">
          <h1 style="font-size: 22px; font-weight: bold; margin: 0 0 6px 0; color: #111827;">${baseName}</h1>
          <div style="font-size: 11px; color: #6b7280;">Chuyển đổi bởi NoteMaster Pro • Ngày ${new Date().toLocaleDateString('vi-VN')}</div>
        </div>
        <div style="font-size: 14px; color: #111827;">
          ${parsed.html || `<p>${parsed.text}</p>`}
        </div>
      `
      document.body.appendChild(container)

      // Ensure all images are loaded before canvas capture
      const images = Array.from(container.querySelectorAll('img'))
      await Promise.all(
        images.map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) resolve(true)
              else {
                img.onload = () => resolve(true)
                img.onerror = () => resolve(true)
              }
            })
        )
      )

      // Small delay for font rendering
      await new Promise((r) => setTimeout(r, 150))

      try {
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        })

        const imgData = canvas.toDataURL('image/jpeg', 0.98)
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        })

        const pdfWidth = 210
        const pdfHeight = 297
        const imgHeightInPdf = (canvas.height * pdfWidth) / canvas.width

        let heightLeft = imgHeightInPdf
        let position = 0

        // Page 1
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeightInPdf)
        heightLeft -= pdfHeight

        // Additional pages if document is longer than 1 A4 page
        while (heightLeft > 0) {
          position = position - pdfHeight
          pdf.addPage()
          pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeightInPdf)
          heightLeft -= pdfHeight
        }

        pdf.save(`${baseName}.pdf`)
      } finally {
        document.body.removeChild(container)
      }
      break
    }
    case 'png':
    case 'jpg': {
      // Render parsed document directly into an image canvas
      const container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.top = '0'
      container.style.left = '0'
      container.style.width = '800px'
      container.style.backgroundColor = '#ffffff'
      container.style.color = '#111827'
      container.style.padding = '40px'
      container.style.fontFamily = '"Times New Roman", Times, serif'
      container.style.zIndex = '-9999'

      container.innerHTML = `
        <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">${baseName}</h1>
        ${parsed.html || `<p>${parsed.text}</p>`}
      `
      document.body.appendChild(container)

      await new Promise((r) => setTimeout(r, 150))

      try {
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        })

        const mime = targetFormat === 'png' ? 'image/png' : 'image/jpeg'
        const dataUrl = canvas.toDataURL(mime, 0.95)
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `${baseName}.${targetFormat}`
        a.click()
      } finally {
        document.body.removeChild(container)
      }
      break
    }
  }
}
