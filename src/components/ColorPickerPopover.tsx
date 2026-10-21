import React, { useState } from 'react'
import { Palette, Check, X } from 'lucide-react'

interface ColorPickerPopoverProps {
  currentColor: string
  onSelectColor: (color: string) => void
}

const PRESET_COLORS = [
  '#000000', // Đen
  '#374151', // Xám đậm
  '#6b7280', // Xám vừa
  '#ef4444', // Đỏ
  '#f97316', // Cam
  '#eab308', // Vàng
  '#10b981', // Xanh lá
  '#06b6d4', // Cyan
  '#3b82f6', // Xanh dương
  '#6366f1', // Indigo
  '#8b5cf6', // Tím
  '#ec4899', // Hồng
]

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  currentColor,
  onSelectColor,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [r, setR] = useState(0)
  const [g, setG] = useState(0)
  const [b, setB] = useState(0)
  const [customHex, setCustomHex] = useState(currentColor || '#000000')

  // Convert RGB to HEX
  const updateFromRgb = (newR: number, newG: number, newB: number) => {
    const clamp = (val: number) => Math.max(0, Math.min(255, val || 0))
    const red = clamp(newR)
    const green = clamp(newG)
    const blue = clamp(newB)
    setR(red)
    setG(green)
    setB(blue)
    const hex =
      '#' +
      [red, green, blue]
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('')
    setCustomHex(hex)
  }

  // Convert HEX to RGB
  const updateFromHex = (hex: string) => {
    setCustomHex(hex)
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      const parsedR = parseInt(hex.substring(1, 3), 16)
      const parsedG = parseInt(hex.substring(3, 5), 16)
      const parsedB = parseInt(hex.substring(5, 7), 16)
      setR(parsedR)
      setG(parsedG)
      setB(parsedB)
    }
  }

  const handleApply = () => {
    onSelectColor(customHex)
    setIsOpen(false)
  }

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-200 flex items-center space-x-1"
        title="Chọn màu chữ (Bảng màu + Tùy chỉnh RGB)"
      >
        <div className="flex flex-col items-center">
          <Palette className="w-4 h-4 text-gray-600 dark:text-zinc-300" />
          <div
            className="w-4 h-1 rounded-full mt-0.5"
            style={{ backgroundColor: currentColor || '#000000' }}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-2xl p-3.5 z-50 text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-zinc-800">
            <span className="font-semibold text-gray-800 dark:text-zinc-200">Màu chữ</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Preset Palettes */}
          <div className="grid grid-cols-6 gap-1.5 mb-3">
            {PRESET_COLORS.map((col) => (
              <button
                key={col}
                onClick={() => {
                  updateFromHex(col)
                  onSelectColor(col)
                  setIsOpen(false)
                }}
                className="w-7 h-7 rounded-md border border-gray-300 dark:border-zinc-700 flex items-center justify-center transition-transform hover:scale-110 shadow-xs"
                style={{ backgroundColor: col }}
                title={col}
              >
                {currentColor.toLowerCase() === col.toLowerCase() && (
                  <Check
                    className={`w-3.5 h-3.5 ${
                      col === '#000000' || col === '#374151' || col === '#6366f1'
                        ? 'text-white'
                        : 'text-black'
                    }`}
                  />
                )}
              </button>
            ))}
          </div>

          {/* RGB Custom Sliders & Inputs */}
          <div className="p-2.5 bg-gray-50 dark:bg-zinc-800/80 rounded-lg border border-gray-200 dark:border-zinc-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[11px] text-gray-600 dark:text-zinc-300">
                Tùy chỉnh màu RGB
              </span>
              <div
                className="w-6 h-6 rounded border border-gray-300 shadow-xs"
                style={{ backgroundColor: customHex }}
              />
            </div>

            {/* Red Channel */}
            <div className="flex items-center space-x-2">
              <span className="w-3 text-[11px] font-bold text-red-500">R</span>
              <input
                type="range"
                min="0"
                max="255"
                value={r}
                onChange={(e) => updateFromRgb(parseInt(e.target.value), g, b)}
                className="flex-1 accent-red-500 h-1"
              />
              <input
                type="number"
                min="0"
                max="255"
                value={r}
                onChange={(e) => updateFromRgb(parseInt(e.target.value), g, b)}
                className="w-10 px-1 py-0.5 text-center text-[11px] border border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 rounded text-gray-800 dark:text-zinc-100"
              />
            </div>

            {/* Green Channel */}
            <div className="flex items-center space-x-2">
              <span className="w-3 text-[11px] font-bold text-emerald-500">G</span>
              <input
                type="range"
                min="0"
                max="255"
                value={g}
                onChange={(e) => updateFromRgb(r, parseInt(e.target.value), b)}
                className="flex-1 accent-emerald-500 h-1"
              />
              <input
                type="number"
                min="0"
                max="255"
                value={g}
                onChange={(e) => updateFromRgb(r, parseInt(e.target.value), b)}
                className="w-10 px-1 py-0.5 text-center text-[11px] border border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 rounded text-gray-800 dark:text-zinc-100"
              />
            </div>

            {/* Blue Channel */}
            <div className="flex items-center space-x-2">
              <span className="w-3 text-[11px] font-bold text-blue-500">B</span>
              <input
                type="range"
                min="0"
                max="255"
                value={b}
                onChange={(e) => updateFromRgb(r, g, parseInt(e.target.value))}
                className="flex-1 accent-blue-500 h-1"
              />
              <input
                type="number"
                min="0"
                max="255"
                value={b}
                onChange={(e) => updateFromRgb(r, g, parseInt(e.target.value))}
                className="w-10 px-1 py-0.5 text-center text-[11px] border border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 rounded text-gray-800 dark:text-zinc-100"
              />
            </div>

            {/* Hex Color Input & HTML Native Color Picker */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-1.5">
                <input
                  type="color"
                  value={customHex}
                  onChange={(e) => updateFromHex(e.target.value)}
                  className="w-6 h-6 border-0 p-0 cursor-pointer rounded overflow-hidden"
                  title="Chọn từ bảng màu hệ thống"
                />
                <input
                  type="text"
                  value={customHex}
                  onChange={(e) => updateFromHex(e.target.value)}
                  className="w-16 px-1.5 py-0.5 text-[11px] font-mono border border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 rounded text-gray-800 dark:text-zinc-100 uppercase"
                />
              </div>

              <button
                onClick={handleApply}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

