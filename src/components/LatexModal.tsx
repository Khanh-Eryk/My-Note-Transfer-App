import React, { useState } from 'react'
import { Copy, Check, X, Download, Eye, Code2 } from 'lucide-react'
import { downloadFile } from '../utils/exportManager'

interface LatexModalProps {
  isOpen: boolean
  onClose: () => void
  latexCode: string
  title: string
}

export const LatexModal: React.FC<LatexModalProps> = ({
  isOpen,
  onClose,
  latexCode,
  title,
}) => {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview')

  if (!isOpen) return null

  // Ensure UTF-8 normalization (NFC) so diacritics are always merged
  const normalizedCode = (latexCode || '').normalize('NFC')

  const handleCopy = () => {
    navigator.clipboard.writeText(normalizedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const cleanTitle = title.trim().replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_') || 'document'
    downloadFile(normalizedCode, `${cleanTitle}.tex`, 'application/x-tex;charset=utf-8')
  }

  // Parse sections, paragraphs and title for live compiled preview simulation
  const renderSimulatedLatexPreview = () => {
    const lines = normalizedCode.split('\n')
    let docTitle = title
    let docAuthor = 'Tác giả'
    const bodyElements: React.ReactNode[] = []

    let inAbstract = false
    let abstractText = ''
    let inTable = false
    let inVerbatim = false
    let verbatimBuffer = ''

    lines.forEach((rawLine, idx) => {
      const line = rawLine.trim()

      if (line.startsWith('\\title{')) {
        docTitle = line.replace(/\\title{(.*)}/, '$1')
        return
      }
      if (line.startsWith('\\author{')) {
        docAuthor = line.replace(/\\author{(.*)}/, '$1')
        return
      }

      if (line.startsWith('\\begin{abstract}')) {
        inAbstract = true
        return
      }
      if (line.startsWith('\\end{abstract}')) {
        inAbstract = false
        bodyElements.push(
          <div key={`abs-${idx}`} className="my-4 px-8 text-xs text-justify italic font-serif text-gray-700 border-t border-b border-gray-300 py-3">
            <div className="font-bold not-italic text-center mb-1">Tóm tắt (Abstract)</div>
            {cleanLatexFormatting(abstractText)}
          </div>
        )
        abstractText = ''
        return
      }
      if (inAbstract) {
        abstractText += ' ' + line
        return
      }

      if (line.startsWith('\\begin{verbatim}')) {
        inVerbatim = true
        return
      }
      if (line.startsWith('\\end{verbatim}')) {
        inVerbatim = false
        bodyElements.push(
          <pre key={`verb-${idx}`} className="bg-gray-100 p-3 rounded font-mono text-xs my-2 overflow-x-auto text-gray-800">
            {verbatimBuffer}
          </pre>
        )
        verbatimBuffer = ''
        return
      }
      if (inVerbatim) {
        verbatimBuffer += rawLine + '\n'
        return
      }

      if (line.startsWith('\\chapter{')) {
        const text = line.replace(/\\chapter{(.*)}/, '$1')
        bodyElements.push(
          <h1 key={`chap-${idx}`} className="text-xl font-bold font-serif uppercase tracking-wide text-center mt-6 mb-3 text-gray-900 border-b pb-1">
            {cleanLatexFormatting(text)}
          </h1>
        )
        return
      }

      if (line.startsWith('\\section{')) {
        const text = line.replace(/\\section{(.*)}/, '$1')
        bodyElements.push(
          <h2 key={`sec-${idx}`} className="text-base font-bold font-serif text-gray-900 mt-4 mb-2">
            {cleanLatexFormatting(text)}
          </h2>
        )
        return
      }

      if (line.startsWith('\\subsection{')) {
        const text = line.replace(/\\subsection{(.*)}/, '$1')
        bodyElements.push(
          <h3 key={`subsec-${idx}`} className="text-sm font-semibold font-serif text-gray-800 mt-3 mb-1">
            {cleanLatexFormatting(text)}
          </h3>
        )
        return
      }

      if (line.startsWith('\\item ')) {
        const itemText = line.replace('\\item ', '')
        bodyElements.push(
          <li key={`item-${idx}`} className="ml-6 text-xs font-serif text-gray-800 list-disc my-0.5">
            {cleanLatexFormatting(itemText)}
          </li>
        )
        return
      }

      if (line.startsWith('\\begin{tabular}')) {
        inTable = true
        return
      }
      if (line.startsWith('\\end{tabular}')) {
        inTable = false
        return
      }

      if (line.length > 0 && !line.startsWith('\\') && !inTable) {
        bodyElements.push(
          <p key={`p-${idx}`} className="text-xs font-serif text-gray-800 text-justify leading-relaxed indent-6 my-1.5">
            {cleanLatexFormatting(line)}
          </p>
        )
      }
    })

    return (
      <div className="bg-[#525659] p-6 flex justify-center overflow-auto min-h-[500px]">
        {/* PDF Simulated Sheet */}
        <div className="bg-white text-black shadow-2xl w-full max-w-[650px] min-h-[850px] p-10 font-serif border border-gray-400">
          <div className="text-center pb-6">
            <h1 className="text-xl font-bold font-serif mb-2">{cleanLatexFormatting(docTitle)}</h1>
            <div className="text-xs text-gray-700 italic">{cleanLatexFormatting(docAuthor)}</div>
            <div className="text-[10px] text-gray-500 mt-1">Được biên dịch tự động bởi LaTeX PDF Engine</div>
          </div>
          <div>{bodyElements}</div>
        </div>
      </div>
    )
  }

  function cleanLatexFormatting(str: string): string {
    if (!str) return ''
    return str
      .normalize('NFC')
      .replace(/\\textbf{(.*?)}/g, '$1')
      .replace(/\\textit{(.*?)}/g, '$1')
      .replace(/\\underline{(.*?)}/g, '$1')
      .replace(/\\textbackslash{}/g, '\\')
      .replace(/\\([&%$#_{}])/g, '$1')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header with Tabs */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50/80">
          <div className="flex items-center space-x-3">
            <span className="text-xl">📑</span>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Trình xem & Chuyển đổi LaTeX</h3>
              <p className="text-[11px] text-gray-500">Xem trực quan trang in sau khi Compile hoặc xem Mã nguồn TeX</p>
            </div>
          </div>

          {/* Toggle Tab Buttons */}
          <div className="flex items-center bg-gray-200 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all ${
                activeTab === 'preview'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem trước sau Compile (PDF)</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all ${
                activeTab === 'code'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Mã nguồn .tex</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'preview' ? (
            renderSimulatedLatexPreview()
          ) : (
            <div className="h-full p-4 bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed overflow-auto">
              <pre>{normalizedCode}</pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">
            Hỗ trợ đầy đủ tiếng Việt có dấu chuẩn <strong className="text-gray-700">UTF-8 NFC</strong> & gói <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-700">babel[vietnamese]</code>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép mã TeX'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Tải file .tex</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
