import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import FontFamily from '@tiptap/extension-font-family'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'

import { FontSize } from './extensions/fontSize'
import { LineHeight } from './extensions/lineHeight'
import { CustomImage } from './extensions/customImage'

import { Toolbar } from './components/Toolbar'
import { LatexModal } from './components/LatexModal'
import { TableInsertModal } from './components/TableInsertModal'
import { TemplateManagerModal } from './components/TemplateManagerModal'
import { Dashboard } from './components/Dashboard'
import { DEFAULT_TEMPLATES, getCustomTemplates, type Template } from './utils/templates'
import { htmlToLatex } from './utils/latexConverter'
import {
  exportToTxt,
  exportToMarkdown,
  exportToLatex,
  exportToPdf,
} from './utils/exportManager'
import { saveProject, type ProjectNote } from './utils/projectStorage'

export function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard')
  const [theme, setTheme] = useState('light')
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(DEFAULT_TEMPLATES[1]) // Thesis default
  const [title, setTitle] = useState('LUẬN VĂN TỐT NGHIỆP')
  const [author, setAuthor] = useState('Nguyễn Văn A')
  const [currentProjectId, setCurrentProjectId] = useState<string>('project-' + Date.now())

  // Modals
  const [showLatexModal, setShowLatexModal] = useState(false)
  const [latexCode, setLatexCode] = useState('')
  const [showTableModal, setShowTableModal] = useState(false)
  const [showTemplateManager, setShowTemplateManager] = useState(false)

  // Load custom templates from local storage
  useEffect(() => {
    const custom = getCustomTemplates()
    setTemplates([...DEFAULT_TEMPLATES, ...custom])
  }, [])

  // TipTap Editor instance
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      LineHeight,
      Underline,
      Highlight,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CustomImage,
    ],
    content: DEFAULT_TEMPLATES[1].content,
  })

  // Open existing project from dashboard
  const handleOpenProject = (project: ProjectNote) => {
    setCurrentProjectId(project.id)
    setTitle(project.title)
    setAuthor(project.author || 'Tác giả')
    const tmpl = templates.find((t) => t.id === project.templateId) || DEFAULT_TEMPLATES[0]
    setSelectedTemplate(tmpl)
    if (editor) {
      editor.commands.setContent(project.content)
    }
    setCurrentView('editor')
  }

  // Create brand new project
  const handleCreateNewProject = () => {
    const newId = 'project-' + Date.now()
    setCurrentProjectId(newId)
    setTitle('Ghi chú / Dự án mới')
    setAuthor('Nguyễn Văn A')
    setSelectedTemplate(DEFAULT_TEMPLATES[0])
    if (editor) {
      editor.commands.setContent(DEFAULT_TEMPLATES[0].content)
    }
    setCurrentView('editor')
  }

  // Save active project to Dashboard
  const handleSaveActiveProject = () => {
    if (!editor) return
    const project: ProjectNote = {
      id: currentProjectId,
      title: title || 'Dự án không tiêu đề',
      author: author || 'Tác giả',
      content: editor.getHTML(),
      templateId: selectedTemplate.id,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    }
    saveProject(project)
    alert('Đã lưu dự án thành công vào Dashboard!')
  }

  // Handle template selection
  const handleSelectTemplate = (tmpl: Template) => {
    setSelectedTemplate(tmpl)
    if (editor) {
      setTitle(tmpl.defaultTitle)
      editor.commands.setContent(tmpl.content)
    }
  }

  // Handle Table insert
  const handleInsertTable = (rows: number, cols: number) => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run()
  }

  // Handle export
  const handleExport = async (format: 'pdf' | 'md' | 'txt' | 'latex') => {
    if (!editor) return
    const html = editor.getHTML()
    const options = {
      title,
      author,
      template: (selectedTemplate.id === 'paper' || selectedTemplate.id === 'thesis'
        ? selectedTemplate.id
        : 'standard') as 'thesis' | 'paper' | 'standard',
    }

    switch (format) {
      case 'txt':
        exportToTxt(html, options)
        break
      case 'md':
        exportToMarkdown(html, options)
        break
      case 'latex':
        exportToLatex(html, options)
        break
      case 'pdf':
        await exportToPdf('printable-document', options)
        break
    }
  }

  // Preview LaTeX modal
  const handlePreviewLatex = () => {
    if (!editor) return
    const html = editor.getHTML()
    const code = htmlToLatex(html, {
      title,
      author,
      template: (selectedTemplate.id === 'paper' || selectedTemplate.id === 'thesis'
        ? selectedTemplate.id
        : 'standard') as 'thesis' | 'paper' | 'standard',
    })
    setLatexCode(code)
    setShowLatexModal(true)
  }

  // View Routing: Show Dashboard or Full Editor
  if (currentView === 'dashboard') {
    return (
      <Dashboard
        onOpenProject={handleOpenProject}
        onCreateNewProject={handleCreateNewProject}
      />
    )
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans theme-${theme} transition-colors duration-200`}>
      {/* Top Ribbon & Format bar */}
      <Toolbar
        editor={editor}
        theme={theme}
        setTheme={setTheme}
        selectedTemplateId={selectedTemplate.id}
        templates={templates}
        onSelectTemplate={handleSelectTemplate}
        onExport={handleExport}
        onPreviewLatex={handlePreviewLatex}
        onOpenTableModal={() => setShowTableModal(true)}
        onOpenTemplateManager={() => setShowTemplateManager(true)}
        onBackToDashboard={() => setCurrentView('dashboard')}
        onSaveProject={handleSaveActiveProject}
      />

      {/* Document Information / Personalization Ribbon */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs border-b border-gray-200 dark:border-zinc-800 px-6 py-2 flex flex-wrap items-center justify-between gap-4 text-xs no-print transition-colors">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="text-gray-500 dark:text-zinc-400 font-medium">Tiêu đề:</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-2.5 py-1 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded font-semibold text-gray-800 dark:text-zinc-100 focus:outline-indigo-500 min-w-[280px]"
              placeholder="Nhập tiêu đề tài liệu..."
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-gray-500 dark:text-zinc-400 font-medium">Tác giả:</span>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="px-2.5 py-1 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded text-gray-800 dark:text-zinc-100 focus:outline-indigo-500 min-w-[160px]"
              placeholder="Họ tên tác giả..."
            />
          </div>
        </div>

        <div className="flex items-center space-x-3 text-gray-500 dark:text-zinc-400">
          <span>Khổ giấy: <strong className="text-gray-800 dark:text-zinc-200">A4 Chuẩn</strong></span>
          <span>•</span>
          <span>
            Định dạng:{' '}
            <strong className="text-indigo-600 dark:text-indigo-400">
              {selectedTemplate.name}
            </strong>
          </span>
        </div>
      </div>

      {/* Main Workspace / Paper Simulation */}
      <main className="flex-1 overflow-auto p-4 md:p-8 flex justify-center">
        <div
          id="printable-document"
          className={`paper-page transition-all duration-200 rounded-lg border w-full max-w-[850px] p-8 md:p-14 min-h-[1100px] relative ${
            selectedTemplate.id === 'paper' ? 'two-column-layout' : ''
          }`}
          style={{
            // Apply standard margin for Thesis
            paddingLeft: selectedTemplate.id === 'thesis' ? '3.5rem' : '2.5rem',
            paddingRight: '2.5rem',
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </main>

      {/* LaTeX Code & Live Compiled Preview Modal */}
      <LatexModal
        isOpen={showLatexModal}
        onClose={() => setShowLatexModal(false)}
        latexCode={latexCode}
        title={title}
      />

      {/* Table Row/Col Modal */}
      <TableInsertModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        onInsert={handleInsertTable}
      />

      {/* Template Manager Modal */}
      <TemplateManagerModal
        isOpen={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
        currentContent={editor ? editor.getHTML() : ''}
        currentTitle={title}
        customTemplates={templates.filter((t) => t.isCustom)}
        onSelectTemplate={handleSelectTemplate}
        onUpdateTemplates={(updatedCustom) => {
          setTemplates([...DEFAULT_TEMPLATES, ...updatedCustom])
        }}
      />
    </div>
  )
}

export default App
