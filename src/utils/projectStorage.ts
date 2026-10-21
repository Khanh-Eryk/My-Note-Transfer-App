export interface ProjectNote {
  id: string
  title: string
  author: string
  content: string
  templateId: string
  updatedAt: number
  createdAt: number
}

const STORAGE_PROJECTS_KEY = 'notemaster_user_projects'
const STORAGE_REVIEWS_KEY = 'notemaster_real_user_reviews'

export function getAllProjects(): ProjectNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROJECTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error(e)
  }
  return []
}

export function saveProject(project: ProjectNote): ProjectNote[] {
  const existing = getAllProjects()
  const updated = [project, ...existing.filter((p) => p.id !== project.id)]
  localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(updated))
  return updated
}

export function deleteProject(id: string): ProjectNote[] {
  const existing = getAllProjects()
  const updated = existing.filter((p) => p.id !== id)
  localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(updated))
  return updated
}

// REAL USER RATINGS AND REVIEWS (Không dùng số ảo / giả định)
export interface RealReviewItem {
  id: string
  rating: number
  comment?: string
  createdAt: number
}

export interface RealRatingData {
  averageRating: number
  totalReviews: number
  userRating?: number
  reviews: RealReviewItem[]
}

export function getRatingData(): RealRatingData {
  try {
    const raw = localStorage.getItem(STORAGE_REVIEWS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed
    }
  } catch (e) {
    console.error(e)
  }

  // Khởi tạo trạng thái đánh giá ban đầu 100% người dùng thật (0 lượt đánh giá khi mới tạo)
  return {
    averageRating: 0,
    totalReviews: 0,
    reviews: [],
  }
}

export function submitRating(stars: number, comment?: string): RealRatingData {
  const current = getRatingData()
  const newReview: RealReviewItem = {
    id: 'rev-' + Date.now(),
    rating: stars,
    comment: comment || '',
    createdAt: Date.now(),
  }

  const updatedReviews = [newReview, ...(current.reviews || [])]
  const total = updatedReviews.length
  const sum = updatedReviews.reduce((acc, curr) => acc + curr.rating, 0)
  const avg = total > 0 ? Number((sum / total).toFixed(1)) : 0

  const result: RealRatingData = {
    averageRating: avg,
    totalReviews: total,
    userRating: stars,
    reviews: updatedReviews,
  }

  localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(result))
  return result
}
