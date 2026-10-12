import { useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { correctField } from '../../api/api.js'
import toast from 'react-hot-toast'

const FIELD_LABELS = {
  product_name:      'Product Name',
  net_quantity:      'Net Quantity',
  mrp:               'MRP',
  manufacturer:      'Manufacturer',
  ingredients:       'Ingredients',
  nutritional_info:  'Nutritional Info',
  fssai_license:     'FSSAI License No.',
  best_before:       'Best Before',
  country_of_origin: 'Country of Origin',
}

export default function FieldEditor({ fieldName, ocrValue, correctedValue, inspectionId, onCorrected }) {
  const [editing, setEditing]   = useState(false)
  const [value, setValue]       = useState(correctedValue ?? ocrValue ?? '')
  const [saving, setSaving]     = useState(false)

  const effectiveValue = correctedValue ?? ocrValue ?? ''
  const isCorrected    = correctedValue !== null && correctedValue !== undefined && correctedValue !== ocrValue

  const handleSave = async () => {
    if (!inspectionId) { toast.error('No inspection ID — save the inspection first.'); return }
    try {
      setSaving(true)
      await correctField({ inspection_id: inspectionId, field_name: fieldName, corrected_value: value })
      toast.success(`${FIELD_LABELS[fieldName] || fieldName} updated`)
      setEditing(false)
      onCorrected?.(fieldName, value)
    } catch {
      toast.error('Failed to save correction')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setValue(correctedValue ?? ocrValue ?? '')
    setEditing(false)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-xs text-slate-400 font-medium">
          {FIELD_LABELS[fieldName] || fieldName}
        </label>
        <div className="flex items-center gap-1.5">
          {isCorrected ? (
            <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded">
              Corrected
            </span>
          ) : (
            <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded">
              OCR
            </span>
          )}
        </div>
      </div>

      {editing ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="input-field flex-1"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary py-1.5 px-2"
            title="Save"
          >
            <Check size={14} />
          </button>
          <button onClick={handleCancel} className="btn-ghost py-1.5 px-2" title="Cancel">
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <div className="flex-1 bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-200 min-h-[36px] truncate">
            {effectiveValue || <span className="text-slate-600 italic">Not detected</span>}
          </div>
          <button
            onClick={() => { setValue(effectiveValue); setEditing(true) }}
            className="opacity-0 group-hover:opacity-100 btn-ghost py-1.5 px-2 transition-opacity"
            title="Edit"
          >
            <Pencil size={13} />
          </button>
        </div>
      )}

      {/* Show original if corrected */}
      {isCorrected && ocrValue && (
        <p className="text-xs text-slate-600 pl-1">
          Original OCR: <span className="text-slate-500">{ocrValue}</span>
        </p>
      )}
    </div>
  )
}
