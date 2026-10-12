import { useNavigate } from 'react-router-dom'
import { Upload, Camera, QrCode, BookOpen } from 'lucide-react'

const ACTIONS = [
  {
    icon: Upload,
    title: 'Upload Product Image',
    description: 'Select a label image from your device for OCR extraction and compliance check.',
    to: '/inspection/new',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'hover:border-teal-500/50',
  },
  {
    icon: Camera,
    title: 'Capture with Camera',
    description: 'Use your device camera to photograph a product label in real time.',
    to: '/inspection/new#camera',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'hover:border-cyan-500/50',
  },
  {
    icon: QrCode,
    title: 'Scan QR Code',
    description: 'Decode and verify QR codes on product packaging for external validation.',
    to: '/inspection/new#qr',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'hover:border-blue-500/50',
  },
  {
    icon: BookOpen,
    title: 'View Compliance Rules',
    description: 'Browse all 9 FSSAI labelling requirements with legal references.',
    to: '/rules',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'hover:border-purple-500/50',
  },
]

export default function QuickActions() {
  const navigate = useNavigate()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {ACTIONS.map(({ icon: Icon, title, description, to, color, bg, border }) => (
        <button
          key={to}
          onClick={() => navigate(to)}
          className={`card text-left flex items-start gap-4 cursor-pointer border border-navy-600 ${border} transition-all duration-200 hover:shadow-md group`}
        >
          <div className={`p-2.5 rounded-lg flex-shrink-0 ${bg} group-hover:scale-110 transition-transform duration-200`}>
            <Icon size={20} className={color} />
          </div>
          <div>
            <p className="text-slate-200 font-medium text-sm mb-1">{title}</p>
            <p className="text-slate-500 text-xs leading-relaxed">{description}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
