import Image from '@tiptap/extension-image'
import { mergeAttributes, ReactNodeViewRenderer } from '@tiptap/react'
import { ResizableImageView } from '../components/ResizableImageView'

export const CustomImage = Image.extend({
  name: 'image',

  // Prevent TipTap/ProseMirror from treating entire custom node as browser-draggable to avoid creating clones on drag
  draggable: false,

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: (attributes) => {
          if (!attributes.width) return {}
          return { width: attributes.width }
        },
      },
      height: {
        default: null,
        renderHTML: (attributes) => {
          if (!attributes.height) return {}
          return { height: attributes.height }
        },
      },
      alignment: {
        default: 'center', // 'left', 'center', 'right', 'behind' (watermark / behind text)
        renderHTML: (attributes) => {
          return {
            'data-alignment': attributes.alignment || 'center',
          }
        },
      },
      positionMode: {
        default: 'inline', // 'inline' (giữa các dòng), 'behind' (nằm sau chữ), 'fixed-left', 'fixed-right', 'free'
        renderHTML: (attributes) => {
          return {
            'data-position-mode': attributes.positionMode || 'inline',
          }
        },
      },
      freeX: {
        default: 0,
        renderHTML: (attributes) => {
          if (!attributes.freeX) return {}
          return { 'data-free-x': attributes.freeX }
        },
      },
      freeY: {
        default: 0,
        renderHTML: (attributes) => {
          if (!attributes.freeY) return {}
          return { 'data-free-y': attributes.freeY }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView)
  },
})
