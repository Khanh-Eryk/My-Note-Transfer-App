import React, { useRef, useState, useEffect } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import {
  Trash2,
  Crop,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layers,
  Move,
  Check,
  X,
  Loader2,
} from 'lucide-react'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import { upscaleImageTo2K } from '../utils/imageUpscaler'

export const ResizableImageView: React.FC<any> = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
}) => {
  const [, setIsResizing] = useState(false)
  const [isCropping, setIsCropping] = useState(false)
  const [isUpscaling, setIsUpscaling] = useState(false)
  const [isDraggingFree, setIsDraggingFree] = useState(false)

  const imgRef = useRef<HTMLImageElement>(null)
  const cropperImgRef = useRef<HTMLImageElement>(null)
  const cropperInstanceRef = useRef<any>(null)

  const width = node.attrs.width || 'auto'
  const alignment = node.attrs.alignment || 'center'
  const positionMode = node.attrs.positionMode || 'inline' // 'inline', 'behind', 'fixed-left', 'fixed-right', 'free'
  const freeX = node.attrs.freeX || 0
  const freeY = node.attrs.freeY || 0

  // Handle Resize Mouse Drag
  const handleMouseDown = (e: React.MouseEvent, direction: 'e' | 'w' | 'se') => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)

    const startX = e.clientX
    const startWidth = imgRef.current?.offsetWidth || 300

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      let newWidth = startWidth
      if (direction === 'e' || direction === 'se') {
        newWidth = Math.max(100, Math.min(800, startWidth + deltaX))
      } else if (direction === 'w') {
        newWidth = Math.max(100, Math.min(800, startWidth - deltaX))
      }
      updateAttributes({ width: `${newWidth}px` })
    }

    const onMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  // Handle Free Dragging (Di chuyển ảnh tự do không tạo bản sao)
  const handleStartFreeDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFree(true)

    const startClientX = e.clientX
    const startClientY = e.clientY
    const startX = freeX
    const startY = freeY

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startClientX
      const deltaY = moveEvent.clientY - startClientY
      updateAttributes({
        positionMode: 'free',
        freeX: Math.round(startX + deltaX),
        freeY: Math.round(startY + deltaY),
      })
    }

    const onMouseUp = () => {
      setIsDraggingFree(false)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  // Handle Keyboard Delete when selected
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selected && (e.key === 'Delete' || e.key === 'Backspace')) {
        deleteNode()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selected, deleteNode])

  // Start Cropping
  const startCrop = () => {
    setIsCropping(true)
  }

  useEffect(() => {
    if (isCropping && cropperImgRef.current) {
      cropperInstanceRef.current = new (Cropper as any)(cropperImgRef.current, {
        viewMode: 1,
        autoCropArea: 0.8,
        responsive: true,
      })
    }
    return () => {
      if (cropperInstanceRef.current) {
        cropperInstanceRef.current.destroy()
        cropperInstanceRef.current = null
      }
    }
  }, [isCropping])

  const applyCrop = () => {
    if (cropperInstanceRef.current) {
      const canvas = cropperInstanceRef.current.getCroppedCanvas()
      if (canvas) {
        const croppedDataUrl = canvas.toDataURL('image/png')
        updateAttributes({ src: croppedDataUrl })
      }
      cropperInstanceRef.current.destroy()
      cropperInstanceRef.current = null
    }
    setIsCropping(false)
  }

  const cancelCrop = () => {
    if (cropperInstanceRef.current) {
      cropperInstanceRef.current.destroy()
      cropperInstanceRef.current = null
    }
    setIsCropping(false)
  }

  // Upscale to 2K directly
  const handleUpscale = async () => {
    try {
      setIsUpscaling(true)
      const highRes = await upscaleImageTo2K(node.attrs.src, 2560)
      updateAttributes({ src: highRes })
    } catch (err) {
      console.error(err)
      alert('Không thể nâng cấp ảnh')
    } finally {
      setIsUpscaling(false)
    }
  }

  // Positioning style
  let containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent:
      alignment === 'left' ? 'flex-start' : alignment === 'right' ? 'flex-end' : 'center',
    margin: '1.25rem 0',
    position: 'relative',
    userSelect: 'none',
  }

  const imgExtraClass = 'rounded-md shadow-xs transition-shadow'

  if (positionMode === 'behind') {
    containerStyle = {
      ...containerStyle,
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 0,
      opacity: 0.25,
      pointerEvents: 'auto',
    }
  } else if (positionMode === 'fixed-left') {
    containerStyle = { ...containerStyle, float: 'left', marginRight: '1.5rem', marginBottom: '1rem' }
  } else if (positionMode === 'fixed-right') {
    containerStyle = { ...containerStyle, float: 'right', marginLeft: '1.5rem', marginBottom: '1rem' }
  } else if (positionMode === 'free') {
    containerStyle = {
      ...containerStyle,
      transform: `translate(${freeX}px, ${freeY}px)`,
      zIndex: 20,
    }
  }

  return (
    <NodeViewWrapper style={containerStyle} className="group relative">
      <div
        className={`relative inline-block transition-all ${
          selected || isDraggingFree ? 'ring-2 ring-indigo-500 rounded-md' : ''
        }`}
        style={{ width: width !== 'auto' ? width : undefined, maxWidth: '100%' }}
      >
        {/* Floating Quick Action Toolbar */}
        <div
          className={`absolute -top-11 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white px-2 py-1 rounded-lg flex items-center space-x-1.5 shadow-xl text-xs z-30 transition-opacity no-print ${
            selected ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
          }`}
        >
          {/* Free Move Handle (Di chuyển tự do kéo thả thật, không copy) */}
          <button
            onMouseDown={handleStartFreeDrag}
            className={`p-1 rounded hover:bg-white/20 cursor-grab active:cursor-grabbing ${
              positionMode === 'free' ? 'bg-indigo-600 text-white' : ''
            }`}
            title="Giữ chuột để Di chuyển tự do (Free Move)"
          >
            <Move className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-3 bg-gray-600 mx-0.5" />

          {/* Position Alignments */}
          <button
            onClick={() => updateAttributes({ alignment: 'left', positionMode: 'inline', freeX: 0, freeY: 0 })}
            className={`p-1 rounded hover:bg-white/20 ${alignment === 'left' && positionMode === 'inline' ? 'bg-white/30 text-indigo-300' : ''}`}
            title="Căn trái (inline)"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => updateAttributes({ alignment: 'center', positionMode: 'inline', freeX: 0, freeY: 0 })}
            className={`p-1 rounded hover:bg-white/20 ${alignment === 'center' && positionMode === 'inline' ? 'bg-white/30 text-indigo-300' : ''}`}
            title="Căn giữa (inline)"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => updateAttributes({ alignment: 'right', positionMode: 'inline', freeX: 0, freeY: 0 })}
            className={`p-1 rounded hover:bg-white/20 ${alignment === 'right' && positionMode === 'inline' ? 'bg-white/30 text-indigo-300' : ''}`}
            title="Căn phải (inline)"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-3 bg-gray-600 mx-0.5" />

          {/* Position Mode: Behind Text (Nằm sau chữ) */}
          <button
            onClick={() =>
              updateAttributes({
                positionMode: positionMode === 'behind' ? 'inline' : 'behind',
                freeX: 0,
                freeY: 0,
              })
            }
            className={`p-1 rounded hover:bg-white/20 ${positionMode === 'behind' ? 'bg-indigo-600 text-white' : ''}`}
            title="Nằm sau chữ (Background / Chìm sau văn bản)"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* Crop Action */}
          <button
            onClick={startCrop}
            className="p-1 rounded hover:bg-white/20"
            title="Cắt ảnh (Crop)"
          >
            <Crop className="w-3.5 h-3.5" />
          </button>

          {/* Upscale 2K */}
          <button
            onClick={handleUpscale}
            disabled={isUpscaling}
            className="p-1 rounded hover:bg-white/20 text-purple-300 hover:text-purple-200"
            title="Nâng cấp ảnh 2K"
          >
            {isUpscaling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          </button>

          <span className="w-px h-3 bg-gray-600 mx-0.5" />

          {/* Delete Action */}
          <button
            onClick={deleteNode}
            className="p-1 rounded hover:bg-red-600/80 text-red-300 hover:text-white"
            title="Xóa ảnh (Delete)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Display Image - draggable set to false to prevent ProseMirror from cloning a copy on drag */}
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt || 'Ảnh minh họa'}
          draggable={false}
          className={`${imgExtraClass} block w-full h-auto cursor-pointer`}
          style={{ width: width !== 'auto' ? '100%' : undefined }}
        />

        {/* Drag Resize Handles */}
        <div
          onMouseDown={(e) => handleMouseDown(e, 'se')}
          className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-600 border-2 border-white rounded-full cursor-se-resize shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 no-print"
          title="Kéo để thay đổi kích thước"
        />
        <div
          onMouseDown={(e) => handleMouseDown(e, 'e')}
          className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-6 bg-indigo-600 border border-white rounded-sm cursor-e-resize shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 no-print"
          title="Kéo sang phải"
        />
        <div
          onMouseDown={(e) => handleMouseDown(e, 'w')}
          className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-6 bg-indigo-600 border border-white rounded-sm cursor-w-resize shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 no-print"
          title="Kéo sang trái"
        />
      </div>

      {/* Cropper Modal Overlay */}
      {isCropping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-xl overflow-hidden max-w-2xl w-full flex flex-col shadow-2xl">
            <div className="p-3 bg-gray-100 flex justify-between items-center border-b">
              <span className="font-semibold text-sm text-gray-800">Cắt ảnh (Crop Image)</span>
              <div className="flex space-x-2">
                <button
                  onClick={cancelCrop}
                  className="px-2.5 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center space-x-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Hủy</span>
                </button>
                <button
                  onClick={applyCrop}
                  className="px-3 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-1 font-medium"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Áp dụng</span>
                </button>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-hidden bg-black flex items-center justify-center p-2">
              <img
                ref={cropperImgRef}
                src={node.attrs.src}
                alt="Crop preview"
                className="max-h-[55vh] max-w-full"
              />
            </div>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  )
}
