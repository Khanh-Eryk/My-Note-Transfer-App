export interface LatexConvertOptions {
  title?: string
  author?: string
  template?: 'thesis' | 'paper' | 'standard'
}

/**
 * Converts HTML content from the editor into a complete, compilable LaTeX document.
 * Preserves native Vietnamese UTF-8 characters without corrupting diacritics into apostrophes.
 */
export function htmlToLatex(html: string, options: LatexConvertOptions = {}): string {
  const { title = 'Tài liệu Ghi chú', author = 'Tác giả', template = 'standard' } = options

  // Normalize Unicode to NFC so that accented characters are combined (e.g., 'à' is single char \u00E0, not 'a' + `)
  const normalizedHtml = (html || '').normalize('NFC')

  // 1. Create a virtual DOM container to parse the HTML
  const parser = new DOMParser()
  const doc = parser.parseFromString(normalizedHtml, 'text/html')

  let latexBody = ''

  function parseNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeLatex(node.textContent || '')
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return ''
    }

    const el = node as HTMLElement
    const tagName = el.tagName.toLowerCase()

    let childContent = ''
    el.childNodes.forEach((child) => {
      childContent += parseNode(child)
    })

    switch (tagName) {
      case 'h1':
        return template === 'thesis' 
          ? `\n\\chapter{${childContent}}\n` 
          : `\n\\section{${childContent}}\n`
      case 'h2':
        return template === 'thesis' 
          ? `\n\\section{${childContent}}\n` 
          : `\n\\subsection{${childContent}}\n`
      case 'h3':
        return template === 'thesis' 
          ? `\n\\subsection{${childContent}}\n` 
          : `\n\\subsubsection{${childContent}}\n`
      case 'p':
        if (!childContent.trim()) return '\n'
        return `\n${childContent}\n`
      case 'strong':
      case 'b':
        return `\\textbf{${childContent}}`
      case 'em':
      case 'i':
        return `\\textit{${childContent}}`
      case 'u':
        return `\\underline{${childContent}}`
      case 'mark':
        return `\\colorbox{yellow}{${childContent}}`
      case 'ul':
        return `\n\\begin{itemize}\n${childContent}\\end{itemize}\n`
      case 'ol':
        return `\n\\begin{enumerate}\n${childContent}\\end{enumerate}\n`
      case 'li':
        return `  \\item ${childContent.trim()}\n`
      case 'blockquote':
        return `\n\\begin{quote}\n${childContent}\n\\end{quote}\n`
      case 'pre':
      case 'code':
        if (tagName === 'pre') {
          return `\n\\begin{verbatim}\n${(el.textContent || '').normalize('NFC')}\n\\end{verbatim}\n`
        }
        return `\\texttt{${escapeLatex(el.textContent || '')}}`
      case 'table':
        return parseTable(el)
      case 'img': {
        const alt = el.getAttribute('alt') || 'Hình ảnh minh họa'
        return `
\\begin{figure}[htbp]
  \\centering
  % \\includegraphics[width=0.8\\linewidth]{image_placeholder.png}
  \\caption{${escapeLatex(alt)}}
  \\label{fig:${Math.random().toString(36).substring(2, 7)}}
\\end{figure}
`
      }
      default:
        return childContent
    }
  }

  function parseTable(tableEl: HTMLElement): string {
    const rows = Array.from(tableEl.querySelectorAll('tr'))
    if (rows.length === 0) return ''

    const colCount = Math.max(...rows.map((r) => r.children.length))
    const colSpec = Array(colCount).fill('|l').join('') + '|'

    let tableLatex = `\n\\begin{table}[htbp]\n\\centering\n\\begin{tabular}{${colSpec}}\n\\hline\n`

    rows.forEach((row) => {
      const cells = Array.from(row.children)
      const cellTexts = cells.map((cell) => {
        let text = ''
        cell.childNodes.forEach((c) => (text += parseNode(c)))
        return text.trim()
      })
      tableLatex += cellTexts.join(' & ') + ' \\\\\n\\hline\n'
    })

    tableLatex += `\\end{tabular}\n\\caption{Bảng số liệu minh họa}\n\\end{table}\n`
    return tableLatex
  }

  // Escape special LaTeX control characters only, preserving all Vietnamese letters
  function escapeLatex(text: string): string {
    return text
      .normalize('NFC')
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/([&%$#_{}])/g, '\\$1')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}')
  }

  // Parse root content
  doc.body.childNodes.forEach((node) => {
    latexBody += parseNode(node)
  })

  // Format document based on preset with utf8x / vietnamese babel
  if (template === 'thesis') {
    return `\\documentclass[12pt, a4paper]{report}
\\usepackage[utf8]{inputenc}
\\usepackage[vietnamese]{babel}
\\usepackage{amsmath, amsfonts, amssymb}
\\usepackage{graphicx}
\\usepackage{xcolor}
\\usepackage{geometry}
\\usepackage{hyperref}

\\geometry{
  a4paper,
  left=30mm,
  right=20mm,
  top=20mm,
  bottom=20mm
}

\\title{${escapeLatex(title)}}
\\author{${escapeLatex(author)}}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Tóm tắt nội dung luận văn và các đóng góp chính của đề tài nghiên cứu.
\\end{abstract}

\\tableofcontents
\\newpage

${latexBody.trim()}

\\end{document}
`
  } else if (template === 'paper') {
    return `\\documentclass[10pt, journal, twocolumn, a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[vietnamese]{babel}
\\usepackage{amsmath, amsfonts, amssymb}
\\usepackage{graphicx}
\\usepackage{xcolor}
\\usepackage{cite}
\\usepackage{geometry}
\\usepackage{hyperref}

\\geometry{
  a4paper,
  margin=20mm
}

\\title{${escapeLatex(title)}}
\\author{${escapeLatex(author)}}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Đây là phần tóm tắt ngắn gọn của bài báo khoa học, giới thiệu mục tiêu, phương pháp đề xuất và kết quả thực nghiệm nổi bật.
\\end{abstract}

${latexBody.trim()}

\\end{document}
`
  }

  // Standard note format
  return `\\documentclass[12pt, a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[vietnamese]{babel}
\\usepackage{amsmath, amsfonts, amssymb}
\\usepackage{graphicx}
\\usepackage{xcolor}
\\usepackage{geometry}
\\usepackage{hyperref}

\\geometry{a4paper, margin=25mm}

\\title{${escapeLatex(title)}}
\\author{${escapeLatex(author)}}
\\date{\\today}

\\begin{document}

\\maketitle

${latexBody.trim()}

\\end{document}
`
}
