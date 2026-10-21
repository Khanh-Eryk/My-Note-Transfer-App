import React, { useRef, useState } from 'react'
import { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Table as TableIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Sparkles,
  FileCode,
  Download,
  Palette,
  Loader2,
  BookmarkPlus,
  Type,
  LayoutDashboard,
  Save,
} from 'lucide-react'
import { upscaleImageTo2K } from '../utils/imageUpscaler'
import type { Template } from '../utils/templates'
import { ColorPickerPopover } from './ColorPickerPopover'

interface ToolbarProps {
  editor: Editor | null
  theme: string
  setTheme: (theme: string) => void
  selectedTemplateId: string
  templates: Template[]
  onSelectTemplate: (template: Template) => void
  onExport: (format: 'pdf' | 'md' | 'txt' | 'latex') => void
  onPreviewLatex: () => void
  onOpenTableModal: () => void
  onOpenTemplateManager: () => void
  onBackToDashboard: () => void
  onSaveProject: () => void
}

export const Toolbar: React.FC<ToolbarProps> = ({
  editor,
  theme,
  setTheme,
  selectedTemplateId,
  templates,
  onSelectTemplate,
  onExport,
  onPreviewLatex,
  onOpenTableModal,
  onOpenTemplateManager,
  onBackToDashboard,
  onSaveProject,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUpscaling, setIsUpscaling] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [lineHeightValue, setLineHeightValue] = useState('1.6')

  if (!editor) return null

  // Handle Font change
  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const font = e.target.value
    if (font === 'default') {
      editor.chain().focus().unsetFontFamily().run()
    } else {
      editor.chain().focus().setFontFamily(font).run()
    }
  }

  // Handle Font Size change
  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = e.target.value
    if (size === 'default') {
      editor.chain().focus().unsetFontSize().run()
    } else {
      editor.chain().focus().setFontSize(size).run()
    }
  }

  // Handle Line Height change (Giãn dòng theo số thực, vd 1.0, 1.15, 1.3, 1.5, 2.0)
  const handleLineHeightChange = (val: string) => {
    setLineHeightValue(val)
    editor.chain().focus().setLineHeight(val).run()
  }

  // Handle Text Color change (RGB & Palettes)
  const handleColorChange = (hex: string) => {
    editor.chain().focus().setColor(hex).run()
  }

  // Handle Standard Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      editor.chain().focus().setImage({ src: dataUrl }).run()
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Handle 2K Upscale
  const handleUpscaleImage = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (ev: Event) => {
      const target = ev.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return

      setIsUpscaling(true)
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const rawSrc = reader.result as string
          const upscaled = await upscaleImageTo2K(rawSrc, 2560)
          editor.chain().focus().setImage({ src: upscaled }).run()
        } catch (err) {
          console.error(err)
          alert('Không thể upscale ảnh. Đã chèn ảnh gốc!')
        } finally {
          setIsUpscaling(false)
        }
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const currentColor = editor.getAttributes('textStyle').color || '#000000'

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 shadow-xs px-4 py-2 no-print transition-colors">
      {/* Top action row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-center space-x-2">
          {/* Back to Dashboard Button */}
          <button
            onClick={onBackToDashboard}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            title="Quay lại Dashboard"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Dashboard</span>
          </button>

          <div className="h-5 w-px bg-gray-200 dark:bg-zinc-700 mx-1" />

          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-base">
            <span className="p-1 bg-indigo-50 dark:bg-indigo-950/60 rounded-md">📝</span>
            <span className="hidden sm:inline">NoteMaster Pro</span>
          </div>

          <div className="h-5 w-px bg-gray-200 dark:bg-zinc-700 mx-2" />

          {/* Template Selector dropdown */}
          <div className="flex items-center space-x-1">
            <select
              value={selectedTemplateId}
              onChange={(e) => {
                const tmpl = templates.find((t) => t.id === e.target.value)
                if (tmpl) onSelectTemplate(tmpl)
              }}
              className="text-xs font-semibold px-2.5 py-1.5 bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none cursor-pointer"
            >
              <optgroup label="Mẫu có sẵn">
                <option value="standard">Ghi chú tự do</option>
                <option value="thesis">🎓 Luận văn / Đồ án</option>
                <option value="paper">📑 Bài báo khoa học (2 cột)</option>
              </optgroup>
              {templates.some((t) => t.isCustom) && (
                <optgroup label="Mẫu cá nhân tùy chỉnh">
                  {templates
                    .filter((t) => t.isCustom)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        ⭐ {t.name}
                      </option>
                    ))}
                </optgroup>
              )}
            </select>

            <button
              onClick={onOpenTemplateManager}
              className="p-1.5 text-gray-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Quản lý / Lưu mẫu mới"
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right side: Save, Themes & Export */}
        <div className="flex items-center space-x-2">
          {/* Quick Save Project Button */}
          <button
            onClick={onSaveProject}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-900 transition-colors cursor-pointer"
            title="Lưu lại vào Dashboard"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu Project</span>
          </button>

          {/* Theme selector */}
          <div className="flex items-center space-x-1 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs">
            <Palette className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400" />
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-transparent border-none text-gray-700 dark:text-zinc-200 outline-none cursor-pointer font-medium"
            >
              <option value="light" className="dark:bg-zinc-900">Trắng hiện đại</option>
              <option value="sepia" className="dark:bg-zinc-900">Giấy ngà (Sepia)</option>
              <option value="dark" className="dark:bg-zinc-900">Chế độ Tối (Dark mode)</option>
            </select>
          </div>

          {/* Preview LaTeX Button */}
          <button
            onClick={onPreviewLatex}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded-lg text-xs font-semibold border border-blue-200 dark:border-blue-900 transition-colors cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Xem trước LaTeX</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất bản</span>
            </button>

            {showExportMenu && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-xl py-1 z-50 text-xs font-medium"
                onClick={() => setShowExportMenu(false)}
              >
                <button
                  onClick={() => onExport('pdf')}
                  className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 dark:hover:bg-zinc-800 flex items-center space-x-2 text-gray-700 dark:text-zinc-200"
                >
                  <span className="text-red-500 font-bold">PDF</span>
                  <span>Xuất bản in ấn (.pdf)</span>
                </button>
                <button
                  onClick={() => onExport('latex')}
                  className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 dark:hover:bg-zinc-800 flex items-center space-x-2 text-gray-700 dark:text-zinc-200"
                >
                  <span className="text-blue-500 font-bold">TEX</span>
                  <span>Mã nguồn LaTeX (.tex)</span>
                </button>
                <button
                  onClick={() => onExport('md')}
                  className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 dark:hover:bg-zinc-800 flex items-center space-x-2 text-gray-700 dark:text-zinc-200"
                >
                  <span className="text-emerald-500 font-bold">MD</span>
                  <span>Tài liệu Markdown (.md)</span>
                </button>
                <button
                  onClick={() => onExport('txt')}
                  className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 dark:hover:bg-zinc-800 flex items-center space-x-2 text-gray-700 dark:text-zinc-200"
                >
                  <span className="text-gray-500 font-bold">TXT</span>
                  <span>Văn bản thuần (.txt)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ribbon format toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2">
        {/* Undo/Redo */}
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300 disabled:opacity-30"
          title="Hoàn tác (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300 disabled:opacity-30"
          title="Làm lại (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700 mx-1" />

        {/* Font Family Picker (Times New Roman, Arial, Lora) */}
        <div className="flex items-center space-x-1">
          <Type className="w-3.5 h-3.5 text-gray-500" />
          <select
            onChange={handleFontChange}
            className="text-xs px-2 py-1 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-gray-700 dark:text-zinc-200 outline-none"
          >
            <option value="default">Phông chữ mặc định</option>
            <option value="'Times New Roman', Times, serif">Times New Roman</option>
            <option value="Arial, Helvetica, sans-serif">Arial</option>
            <option value="'Lora', Georgia, serif">Lora (Học thuật)</option>
          </select>
        </div>

        {/* Font Size Picker */}
        <select
          onChange={handleFontSizeChange}
          className="text-xs px-2 py-1 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-gray-700 dark:text-zinc-200 outline-none"
          title="Cỡ chữ"
        >
          <option value="default">Cỡ chữ</option>
          <option value="12px">12 pt</option>
          <option value="13px">13 pt (Chuẩn VN)</option>
          <option value="14px">14 pt</option>
          <option value="16px">16 pt</option>
          <option value="18px">18 pt</option>
          <option value="20px">20 pt</option>
          <option value="24px">24 pt</option>
          <option value="28px">28 pt</option>
        </select>

        {/* Line Height Custom Input (Giãn dòng nhập số) */}
        <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-xs">
          <span className="text-[11px] text-gray-500 dark:text-zinc-400 font-medium">Dãn dòng:</span>
          <input
            type="number"
            step="0.1"
            min="1.0"
            max="3.0"
            value={lineHeightValue}
            onChange={(e) => handleLineHeightChange(e.target.value)}
            className="w-12 px-1 py-0.5 text-center bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded font-semibold text-gray-800 dark:text-zinc-200 focus:outline-indigo-500"
            title="Nhập số dãn dòng (ví dụ 1.2, 1.3, 1.5, 2.0)"
          />
        </div>

        {/* Color Picker with RGB Custom Controls */}
        <ColorPickerPopover
          currentColor={currentColor}
          onSelectColor={handleColorChange}
        />

        <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700 mx-1" />

        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300'}`}
          title="Tiêu đề 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300'}`}
          title="Tiêu đề 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300'}`}
          title="Tiêu đề 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700 mx-1" />

        {/* Text Styles */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded ${editor.isActive('bold') ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300'}`}
          title="In đậm (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded ${editor.isActive('italic') ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300'}`}
          title="In nghiêng (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded ${editor.isActive('underline') ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300'}`}
          title="Gạch chân (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`p-1.5 rounded ${editor.isActive('highlight') ? 'bg-yellow-200 text-yellow-800' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300'}`}
          title="Đánh dấu highlight"
        >
          <Highlighter className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700 mx-1" />

        {/* Alignments */}
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-1.5 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300'}`}
          title="Căn trái"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-1.5 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300'}`}
          title="Căn giữa"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-1.5 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300'}`}
          title="Căn phải"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-1.5 rounded ${editor.isActive({ textAlign: 'justify' }) ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300'}`}
          title="Căn đều hai bên"
        >
          <AlignJustify className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700 mx-1" />

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded ${editor.isActive('bulletList') ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300'}`}
          title="Danh sách dấu đầu dòng"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded ${editor.isActive('orderedList') ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300'}`}
          title="Danh sách đánh số"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700 mx-1" />

        {/* Custom Table Trigger */}
        <button
          onClick={onOpenTableModal}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300 flex items-center space-x-1"
          title="Tùy chỉnh chèn bảng (chọn số dòng, số cột)"
        >
          <TableIcon className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700 mx-1" />

        {/* Standard Image upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300"
          title="Chèn ảnh thông thường"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        {/* 2K Image Upscale Action */}
        <button
          onClick={handleUpscaleImage}
          disabled={isUpscaling}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 font-medium text-xs transition-colors"
          title="Tải ảnh lên và tự động upscale lên 2K siêu nét"
        >
          {isUpscaling ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          )}
          <span>Upscale 2K</span>
        </button>
      </div>
    </header>
  )
}
