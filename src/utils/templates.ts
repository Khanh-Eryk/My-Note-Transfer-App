export interface Template {
  id: string
  name: string
  description: string
  defaultTitle: string
  content: string
  isCustom?: boolean
}

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'standard',
    name: 'Ghi chú tự do',
    description: 'Trang trắng đơn giản cho ghi chép thường ngày',
    defaultTitle: 'Ghi chú mới',
    content: `
      <h1>Ghi chú cá nhân</h1>
      <p>Bắt đầu viết suy nghĩ, ý tưởng và công việc của bạn tại đây...</p>
      <ul>
        <li>Nhiệm vụ cần làm hôm nay</li>
        <li>Tài liệu cần đọc</li>
      </ul>
    `,
  },
  {
    id: 'thesis',
    name: 'Luận văn / Đồ án',
    description: 'Định dạng chuẩn học thuật với các chương mục, lề chuẩn luận văn',
    defaultTitle: 'LUẬN VĂN TỐT NGHIỆP',
    content: `
      <h1 style="text-align: center;">ĐẠI HỌC QUỐC GIA TP. HỒ CHÍ MINH</h1>
      <h2 style="text-align: center;">KHOA KỸ THUẬT VÀ KHOA HỌC MÁY TÍNH</h2>
      <p style="text-align: center;">&nbsp;</p>
      <h1 style="text-align: center; color: #1e3a8a;">BÁO CÁO LUẬN VĂN TỐT NGHIỆP</h1>
      <h3 style="text-align: center;">ĐỀ TÀI: NGHIÊN CỨU VÀ PHÁT TRIỂN HỆ THỐNG GHI CHÚ THÔNG MINH</h3>
      <p style="text-align: center;">&nbsp;</p>
      <p><strong>Sinh viên thực hiện:</strong> Nguyễn Văn A - MSSV: 20210001</p>
      <p><strong>Giảng viên hướng dẫn:</strong> TS. Trần Văn B</p>
      <hr />
      <h1>LỜI CẢM ƠN</h1>
      <p>Em xin chân thành cảm ơn các thầy cô trong bộ môn đã tận tình hướng dẫn...</p>
      <h1>CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI</h1>
      <h2>1.1. Đặt vấn đề</h2>
      <p>Trong kỷ nguyên số, nhu cầu ghi chép và tổ chức tài liệu cá nhân đóng vai trò vô cùng quan trọng...</p>
      <h2>1.2. Mục tiêu nghiên cứu</h2>
      <ul>
        <li>Xây dựng trình soạn thảo WYSIWYG tiện dụng.</li>
        <li>Hỗ trợ xuất bản sang LaTeX, PDF và Markdown chất lượng cao.</li>
      </ul>
      <h1>CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ PHƯƠNG PHÁP</h1>
      <p>Phần này trình bày các mô hình kiến trúc và thuật toán nội suy nâng cao...</p>
    `,
  },
  {
    id: 'paper',
    name: 'Bài báo khoa học',
    description: 'Bố cục 2 cột phong cách IEEE / Journal, Abstract, trích dẫn',
    defaultTitle: 'A Novel Architecture for Smart Note-Taking and LaTeX Synthesis',
    content: `
      <div class="paper-header">
        <h1 style="text-align: center;">A Novel Framework for Interactive Document Authoring and LaTeX Transformation</h1>
        <p style="text-align: center; font-style: italic;">Nguyen Van A, Tran Van B<br/>Department of Computer Science, University of Technology</p>
      </div>
      <div class="paper-abstract" style="background: #f8fafc; border-left: 3px solid #0284c7; padding: 12px; margin-bottom: 20px;">
        <p><strong>Abstract</strong>—In this paper, we present an end-to-end customizable note-taking environment capable of direct high-resolution 2K image processing and automated LaTeX document generation. The framework bridges the gap between everyday rich-text authoring and rigorous scientific publication workflows.</p>
        <p><strong>Keywords</strong>—Document Processing, LaTeX Converter, Image Upscaling, Rich Text Editor.</p>
      </div>
      <h1>1. Introduction</h1>
      <p>Authoring academic documents has traditionally forced researchers to choose between the immediate visual feedback of WYSIWYG editors and the rigorous typesetting precision of LaTeX.</p>
      <h1>2. Proposed Architecture</h1>
      <p>Our pipeline incorporates a dynamic AST translation engine and client-side super-sampling filters that guarantee 2K resolution fidelity upon export.</p>
      <h2>2.1. Mathematical Formulation</h2>
      <p>The image upscaling filter applies an unsharp Laplacian operator over the discrete RGB color domain.</p>
      <h1>3. Experimental Results</h1>
      <p>Extensive evaluations confirm seamless PDF generation and fully valid LaTeX document compilation without post-editing requirements.</p>
      <h1>4. References</h1>
      <ol>
        <li>J. Doe, "Modern Document Architecture," IEEE Trans. Softw. Eng., vol. 45, no. 3, 2024.</li>
        <li>A. Smith, "Real-time High Resolution Image Upscaling," ACM Comput. Surv., 2025.</li>
      </ol>
    `,
  },
]

const STORAGE_KEY = 'notemaster_custom_templates'

export function getCustomTemplates(): Template[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error(e)
  }
  return []
}

export function saveCustomTemplate(tmpl: Omit<Template, 'isCustom'>): Template[] {
  const existing = getCustomTemplates()
  const newTmpl: Template = { ...tmpl, isCustom: true }
  const updated = [newTmpl, ...existing.filter((t) => t.id !== newTmpl.id)]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}

export function deleteCustomTemplate(id: string): Template[] {
  const existing = getCustomTemplates()
  const updated = existing.filter((t) => t.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}
