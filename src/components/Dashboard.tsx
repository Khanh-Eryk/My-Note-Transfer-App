import React, { useState, useEffect, useRef } from 'react'
import {
  FileText,
  Plus,
  Trash2,
  Clock,
  ArrowRight,
  ArrowRightLeft,
  Users,
  Star,
  Upload,
  Download,
  Loader2,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react'
import {
  getAllProjects,
  deleteProject,
  getRatingData,
  submitRating,
  type ProjectNote,
  type RealRatingData,
} from '../utils/projectStorage'
import { convertAndDownload, type SupportedFormat } from '../utils/fileConverter'

interface DashboardProps {
  onOpenProject: (project: ProjectNote) => void
  onCreateNewProject: () => void
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenProject,
  onCreateNewProject,
}) => {
  const [projects, setProjects] = useState<ProjectNote[]>([])
  const [onlineUsers, setOnlineUsers] = useState(1)
  const [ratingData, setRatingData] = useState<RealRatingData>({
    averageRating: 0,
    totalReviews: 0,
    reviews: [],
  })
  const [userStars, setUserStars] = useState<number>(0)
  const [hoverStars, setHoverStars] = useState<number>(0)
  const [ratingComment, setRatingComment] = useState('')
  const [ratingSubmitted, setRatingSubmitted] = useState(false)
  const [showReviewInput, setShowReviewInput] = useState(false)

  // Converter state
  const [convertFile, setConvertFile] = useState<File | null>(null)
  const [targetFormat, setTargetFormat] = useState<SupportedFormat>('pdf')
  const [isConverting, setIsConverting] = useState(false)
  const [convertSuccess, setConvertSuccess] = useState(false)
  const [fileDetails, setFileDetails] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Load local projects & real reviews
    setProjects(getAllProjects())
    const initialRating = getRatingData()
    setRatingData(initialRating)
    if (initialRating.userRating) {
      setUserStars(initialRating.userRating)
    }

    // Tab-based cross-window real active user count using BroadcastChannel / Storage events
    const channelName = 'notemaster_live_presence'
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(channelName) : null

    // Broadcast presence
    if (channel) {
      channel.postMessage({ type: 'ping' })
      channel.onmessage = (e) => {
        if (e.data?.type === 'ping') {
          channel.postMessage({ type: 'pong' })
          setOnlineUsers((prev) => Math.max(1, prev + 1))
        } else if (e.data?.type === 'pong') {
          setOnlineUsers((prev) => Math.max(1, prev + 1))
        }
      }
    }

    return () => {
      if (channel) channel.close()
    }
  }, [])

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Bạn có chắc muốn xóa dự án ghi chú này?')) {
      const updated = deleteProject(id)
      setProjects(updated)
    }
  }

  const handleSelectStar = (stars: number) => {
    setUserStars(stars)
    setShowReviewInput(true)
  }

  const handleConfirmRating = () => {
    if (userStars === 0) return
    const updated = submitRating(userStars, ratingComment)
    setRatingData(updated)
    setRatingSubmitted(true)
    setShowReviewInput(false)
    setTimeout(() => setRatingSubmitted(false), 4000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setConvertFile(file)
      setConvertSuccess(false)
      const sizeKb = (file.size / 1024).toFixed(1)
      const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE'
      setFileDetails(`${ext} • ${sizeKb} KB`)
    }
  }

  const handleRunConversion = async () => {
    if (!convertFile) return
    setIsConverting(true)
    setConvertSuccess(false)
    try {
      await convertAndDownload(convertFile, targetFormat)
      setConvertSuccess(true)
    } catch (err) {
      console.error(err)
      alert('Chuyển đổi thất bại! Vui lòng kiểm tra lại file.')
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20 text-white font-bold text-xl">
            📝
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">NoteMaster Pro</h1>
            <p className="text-xs text-slate-400">Không gian làm việc & Bảng điều khiển cá nhân</p>
          </div>
        </div>

        {/* Live Active Users & Action */}
        <div className="flex items-center space-x-6">
          {/* Active Users Badge */}
          <div className="flex items-center space-x-2 bg-emerald-950/60 border border-emerald-800/60 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-400 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Users className="w-3.5 h-3.5" />
            <span>{onlineUsers} tab/người đang hoạt động</span>
          </div>

          {/* Quick New Note Button */}
          <button
            onClick={onCreateNewProject}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Project Mới</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Banner with Stats & Real Star Ratings */}
        <section className="bg-gradient-to-r from-slate-800/90 via-indigo-950/40 to-slate-800/90 border border-slate-700/60 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="space-y-2 z-10">
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Nền tảng Biên tập & Chuyển đổi Văn bản Học thuật</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              Chào mừng bạn trở lại! 👋
            </h2>
            <p className="text-sm text-slate-300 max-w-xl">
              Hệ thống xử lý định dạng chuẩn xác 100%, bảo toàn trọn vẹn văn bản, tiêu đề, bảng biểu và hình ảnh khi xuất PDF, LaTeX hoặc Markdown.
            </p>
          </div>

          {/* REAL Community Rating Card */}
          <div className="bg-slate-900/90 border border-slate-700/90 p-5 rounded-2xl flex flex-col items-center space-y-2 shadow-lg min-w-[280px] z-10">
            <span className="text-xs font-bold text-slate-300">Đánh giá người dùng thực tế</span>
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-black text-amber-400">
                {ratingData.totalReviews > 0 ? ratingData.averageRating : '0.0'}
              </span>
              <span className="text-xs text-slate-400">/ 5.0</span>
            </div>

            {/* Interactive 5-star rating */}
            <div className="flex items-center space-x-1 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleSelectStar(star)}
                  onMouseEnter={() => setHoverStars(star)}
                  onMouseLeave={() => setHoverStars(0)}
                  className="p-1 text-slate-600 hover:scale-125 transition-transform cursor-pointer"
                  title={`Đánh giá ${star} sao`}
                >
                  <Star
                    className={`w-5 h-5 ${
                      (hoverStars || userStars || 0) >= star
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Feedback message or rating count */}
            <div className="text-[11px] text-slate-400 text-center">
              {ratingSubmitted ? (
                <span className="text-emerald-400 font-semibold">Đã ghi nhận đánh giá thật của bạn! ❤️</span>
              ) : ratingData.totalReviews > 0 ? (
                `Dựa trên ${ratingData.totalReviews} lượt đánh giá thực tế`
              ) : (
                'Chưa có lượt đánh giá nào. Hãy là người đầu tiên đánh giá!'
              )}
            </div>

            {/* Optional real review feedback form */}
            {showReviewInput && (
              <div className="w-full pt-2 border-t border-slate-800 space-y-2">
                <input
                  type="text"
                  placeholder="Ý kiến góp ý của bạn (tùy chọn)..."
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-indigo-500"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowReviewInput(false)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1"
                  >
                    Bỏ qua
                  </button>
                  <button
                    onClick={handleConfirmRating}
                    className="text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-2.5 py-1 rounded-lg"
                  >
                    Gửi đánh giá
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Feature 1: Universal File Format Converter (High Precision Render) */}
        <section className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 md:p-8 space-y-5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Chuyển đổi Định dạng Chuẩn xác (High-Fidelity Converter)</h3>
              <p className="text-xs text-slate-400">
                Chuyển đổi tài liệu (Word, PDF, Markdown, TXT, Ảnh) với độ nét cao, bảo đảm 100% nội dung chữ và hình ảnh, không bị trang trắng
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-900/60 p-5 rounded-2xl border border-slate-700/50">
            {/* Upload Area */}
            <div className="md:col-span-5">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".doc,.docx,.pdf,.md,.txt,.png,.jpg,.jpeg,.html"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed p-6 rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
                  convertFile
                    ? 'border-indigo-500 bg-indigo-950/30'
                    : 'border-slate-700 hover:border-indigo-500 hover:bg-indigo-950/20'
                }`}
              >
                <Upload className="w-7 h-7 text-indigo-400" />
                <div className="text-xs font-semibold text-slate-200">
                  {convertFile ? convertFile.name : 'Nhấp để tải lên file cần chuyển đổi'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {convertFile ? fileDetails : 'Hỗ trợ: Word (.docx, .doc), PDF, Markdown (.md), TXT, Ảnh PNG/JPG'}
                </div>
              </div>
            </div>

            {/* Arrow Divider */}
            <div className="md:col-span-2 flex justify-center text-slate-500">
              <div className="p-2 bg-slate-800 rounded-full border border-slate-700">
                <ArrowRight className="w-5 h-5 text-indigo-400" />
              </div>
            </div>

            {/* Target Format Selector & Action */}
            <div className="md:col-span-5 space-y-3">
              <label className="block text-xs font-medium text-slate-400">Chọn định dạng đích xuất ra:</label>
              <select
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value as SupportedFormat)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="pdf">📕 PDF Document (.pdf) - Trang in A4 sắc nét (Không trang trắng)</option>
                <option value="latex">📄 LaTeX Source Code (.tex) - Mã nguồn học thuật chuẩn UTF-8</option>
                <option value="md">📝 Markdown Document (.md) - Chuẩn tiêu đề ATX</option>
                <option value="txt">📋 Plain Text (.txt) - Văn bản thuần trích xuất</option>
                <option value="html">🌐 Web Page HTML (.html) - Đầy đủ cấu trúc bảng và kiểu chữ</option>
                <option value="png">🖼️ Hình ảnh PNG (.png) - Ảnh chụp văn bản 2K</option>
                <option value="jpg">🖼️ Hình ảnh JPG (.jpg) - Ảnh chất lượng cao</option>
              </select>

              <button
                onClick={handleRunConversion}
                disabled={!convertFile || isConverting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang render & chuyển đổi chuẩn xác...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Chuyển đổi & Tải về kết quả</span>
                  </>
                )}
              </button>

              {convertSuccess && (
                <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-800/60 p-2.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Đã chuyển đổi và tải file hoàn tất với đầy đủ nội dung!</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Feature 2: Projects & Saved Notes List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">Dự án & Ghi chú của bạn ({projects.length})</h3>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-16 bg-slate-800/40 border border-slate-800 rounded-3xl space-y-3">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-slate-300">Chưa có dự án ghi chú nào được lưu</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Hãy bắt đầu tạo văn bản đầu tiên hoặc chọn một format mẫu để soạn thảo ngay lập tức.
              </p>
              <button
                onClick={onCreateNewProject}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Bắt đầu viết ngay</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => onOpenProject(proj)}
                  className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 hover:border-indigo-500/80 rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xl group flex flex-col justify-between h-48"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="p-2 bg-indigo-950/60 text-indigo-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <button
                        onClick={(e) => handleDelete(proj.id, e)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                        title="Xóa dự án này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h4 className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 line-clamp-1">
                      {proj.title || 'Ghi chú không tiêu đề'}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {proj.content.replace(/<[^>]+>/g, ' ').trim() || 'Chưa có nội dung...'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(proj.updatedAt).toLocaleDateString('vi-VN')}</span>
                    </span>
                    <span className="text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center space-x-1 font-semibold">
                      <span>Mở soạn thảo</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
