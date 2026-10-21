import React, { useState } from 'react'
import { Table, X, Plus } from 'lucide-react'

interface TableInsertModalProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (rows: number, cols: number) => void
}

export const TableInsertModal: React.FC<TableInsertModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  const [hoverRow, setHoverRow] = useState(3)
  const [hoverCol, setHoverCol] = useState(3)

  if (!isOpen) return null

  const maxGrid = 8

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 no-print">
      <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-sm border border-gray-100">
        <div className="flex justify-between items-center pb-3 mb-3 border-b border-gray-100">
          <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-sm">
            <Table className="w-4 h-4" />
            <span>Tùy chỉnh chèn bảng biểu</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visual Grid Picker */}
        <div className="flex flex-col items-center mb-4">
          <div className="text-xs font-medium text-gray-600 mb-2">
            Kích thước: <strong className="text-indigo-600 font-bold">{hoverRow} hàng × {hoverCol} cột</strong>
          </div>
          <div
            className="grid gap-1 bg-gray-50 p-2 rounded-lg border border-gray-200"
            style={{ gridTemplateColumns: `repeat(${maxGrid}, minmax(0, 1fr))` }}
            onMouseLeave={() => {
              setHoverRow(rows)
              setHoverCol(cols)
            }}
          >
            {Array.from({ length: maxGrid }).map((_, rIndex) =>
              Array.from({ length: maxGrid }).map((_, cIndex) => {
                const isSelected = rIndex < hoverRow && cIndex < hoverCol
                return (
                  <div
                    key={`${rIndex}-${cIndex}`}
                    onMouseEnter={() => {
                      setHoverRow(rIndex + 1)
                      setHoverCol(cIndex + 1)
                    }}
                    onClick={() => {
                      setRows(rIndex + 1)
                      setCols(cIndex + 1)
                    }}
                    className={`w-5 h-5 rounded-xs border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-500 border-indigo-600'
                        : 'bg-white border-gray-300 hover:bg-indigo-100'
                    }`}
                  />
                )
              })
            )}
          </div>
        </div>

        {/* Manual Input Fields */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Số dòng (Rows):</label>
            <input
              type="number"
              min={1}
              max={50}
              value={rows}
              onChange={(e) => {
                const val = Math.max(1, parseInt(e.target.value) || 1)
                setRows(val)
                setHoverRow(val)
              }}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-indigo-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Số cột (Cols):</label>
            <input
              type="number"
              min={1}
              max={20}
              value={cols}
              onChange={(e) => {
                const val = Math.max(1, parseInt(e.target.value) || 1)
                setCols(val)
                setHoverCol(val)
              }}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-indigo-500 font-medium"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
          >
            Hủy
          </button>
          <button
            onClick={() => {
              onInsert(rows, cols)
              onClose()
            }}
            className="px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center space-x-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo bảng</span>
          </button>
        </div>
      </div>
    </div>
  )
}

