import { Shield, Radar, Database, History, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import StatusIndicator from "./status-indicator"

export default function Header() {
  return (
    <header className="flex justify-between items-center my-8 max-sm:my-6 print:hidden">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Shield className="w-8 h-8 text-cyan-400" />
          <Radar className="w-4 h-4 text-cyan-300 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-cyan-400" />
          <div className="flex items-center gap-2">
            <StatusIndicator status="active" />
            <small className="text-xs text-cyan-400 font-mono uppercase tracking-wider">
              Zhizhan Intelligence Platform
            </small>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" className="intel-button h-10 w-10">
          <History className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="intel-button h-10 w-10">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
