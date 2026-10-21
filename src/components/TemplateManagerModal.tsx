import React, { useState, useRef } from 'react'
import { type Template, saveCustomTemplate, deleteCustomTemplate } from '../utils/templates'
import { BookmarkPlus, Upload, Trash2, X, FileText, Check } from 'lucide-react'

interface TemplateManagerModalProps {
  isOpen: boolean
  onClose: () => void
  currentContent: string
  currentTitle: string
  customTemplates: Template[]
  onSelectTemplate: (template: Template) => void
  onUpdateTemplates: (templates: Template[]) => void
}

export const TemplateManagerModal: React.FC<TemplateManagerModalProps> = ({
  isOpen,
  onClose,
  currentContent,
  currentTitle,
  customTemplates,
  onSelectTemplate,
  onUpdateTemplates,
}) => {
  const [templateName, setTemplateName] = useState('')
  const [templateDesc, setTemplateDesc] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [savedSuccess, setSavedSuccess] = useState(false)

  if (!isOpen) return null

  // Save current active document as a reusable custom template
  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!templateName.trim()) return

    const newTmpl = {
      id: 'custom-' + Date.now(),
      name: templateName.trim(),
      description: templateDesc.trim() || 'Mẫu người dùng tùy chỉnh',
      defaultTitle: currentTitle || 'Tài liệu mới',
      content: currentContent,
    }

    const updated = saveCustomTemplate(newTmpl)
    onUpdateTemplates(updated)
    setTemplateName('')
    setTemplateDesc('')
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2000)
  }

  // Upload an HTML / JSON / Markdown template file from disk
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const content = reader.result as string
      const fileName = file.name.replace(/\.[^/.]+$/, '')

      const newTmpl = {
        id: 'custom-file-' + Date.now(),
        name: fileName,
        description: `Tải lên từ file: ${file.name}`,
        defaultTitle: fileName,
        content: content,
      }

      const updated = saveCustomTemplate(newTmpl)
      onUpdateTemplates(updated)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Delete a saved template
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Bạn có chắc muốn xóa mẫu này?')) {
      const updated = deleteCustomTemplate(id)
      onUpdateTemplates(updated)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <BookmarkPlus className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Quản lý Mẫu Format Cá nhân</h3>
              <p className="text-xs text-gray-500">Lưu lại cấu trúc bài viết hiện tại hoặc tải file mẫu từ máy tính</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Section 1: Save current work as template */}
          <form onSubmit={handleSaveCurrentAsTemplate} className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-2">
              Lưu văn bản đang soạn thành Mẫu mới
            </h4>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Tên mẫu (ví dụ: Mẫu Báo cáo Tuần, Đề xuất đề tài...)"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-indigo-500"
                required
              />
              <input
                type="text"
                placeholder="Mô tả ngắn về mẫu..."
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-indigo-500"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-gray-500">Mẫu sẽ lưu lại toàn bộ định dạng, bảng và kiểu chữ</span>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-xs"
                >
                  {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                  <span>{savedSuccess ? 'Đã lưu!' : 'Lưu làm mẫu'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Section 2: Upload external template */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <div>
              <div className="text-xs font-semibold text-gray-800">Tải file mẫu từ máy tính</div>
              <div className="text-[11px] text-gray-500">Chấp nhận file định dạng .html, .txt, .md</div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".html,.txt,.md,.json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium flex items-center space-x-1.5 shadow-xs"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tải file lên</span>
            </button>
          </div>

          {/* Section 3: List of Saved Custom Templates */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Danh sách mẫu cá nhân của bạn ({customTemplates.length})
            </h4>

            {customTemplates.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs border border-gray-100 rounded-xl bg-gray-50">
                Chưa có mẫu tùy chỉnh nào được lưu.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-auto">
                {customTemplates.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      onSelectTemplate(t)
                      onClose()
                    }}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 rounded-xl cursor-pointer transition-all group shadow-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <div>
                        <div className="text-xs font-semibold text-gray-800 group-hover:text-indigo-600">
                          {t.name}
                        </div>
                        <div className="text-[11px] text-gray-500">{t.description}</div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(t.id, e)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                      title="Xóa mẫu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-lg font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
