type StatusType = "active" | "processing" | "standby" | "error"

interface StatusIndicatorProps {
  status: StatusType
}

export default function StatusIndicator({ status }: StatusIndicatorProps) {
  return <div className={`status-indicator ${status}`} />
}
