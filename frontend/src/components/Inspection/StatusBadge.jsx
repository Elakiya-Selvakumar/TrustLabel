export default function StatusBadge({ status }) {
  const map = {
    pass:        { cls: 'badge-pass',        label: 'PASS' },
    fail:        { cls: 'badge-fail',        label: 'FAIL' },
    warn:        { cls: 'badge-warn',        label: 'WARNING' },
    pending:     { cls: 'badge-pending',     label: 'PENDING' },
    review:      { cls: 'badge-warn',        label: 'REVIEW' },
    unavailable: { cls: 'badge-unavailable', label: 'UNAVAILABLE' },
    exempt:      { cls: 'badge-pending',     label: 'EXEMPT' },
  }
  const { cls, label } = map[status?.toLowerCase()] ?? { cls: 'badge-unavailable', label: status?.toUpperCase() ?? '—' }
  return <span className={cls}>{label}</span>
}
