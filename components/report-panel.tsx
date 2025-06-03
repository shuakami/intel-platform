"use client"

import StatusIndicator from "./status-indicator"
import { useIntelStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Download, FileText, BarChart3 } from "lucide-react"
import { useState } from "react"

export default function ReportPanel() {
  const { analysisStatus, reportData, rawMarkdown, htmlContent } = useIntelStore()
  const [showAnalysis, setShowAnalysis] = useState(false)

  const downloadMarkdown = () => {
    if (!rawMarkdown) return

    const blob = new Blob([rawMarkdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "scraped-content.md"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="intel-panel rounded-lg p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <StatusIndicator status={analysisStatus === "active" ? "active" : "standby"} />
        <h2 className="text-xl font-semibold text-cyan-300">
          <span className="intel-text">爬取内容</span>
        </h2>
        <div className="flex-1"></div>
        <div className="flex items-center gap-2">
          {analysisStatus === "active" && rawMarkdown && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="intel-button text-xs"
                onClick={() => setShowAnalysis(!showAnalysis)}
              >
                {showAnalysis ? (
                  <>
                    <FileText className="w-3 h-3 mr-1" />
                    原始内容
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-3 h-3 mr-1" />
                    分析报告
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" className="intel-button text-xs" onClick={downloadMarkdown}>
                <Download className="w-3 h-3 mr-1" />
                下载
              </Button>
            </>
          )}
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
            <span>CLASSIFIED</span>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      <section className="intel-section border rounded-md p-4 print:border-none">
        <h3 className="font-semibold text-lg border-b border-cyan-800/30 mb-2 leading-10 print:hidden text-cyan-300">
          4. {showAnalysis ? "分析报告" : "网页原始内容"}
        </h3>
        <div className="text-sm">
          {analysisStatus === "active" ? (
            showAnalysis && reportData ? (
              <div className="prose prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: reportData }} />
              </div>
            ) : htmlContent ? (
              <div className="prose prose-invert max-w-none">
                <div
                  className="bg-black/10 p-4 rounded border border-cyan-800/30 max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              </div>
            ) : null
          ) : (
            <div className="text-gray-400">等待网页内容爬取...</div>
          )}
        </div>
      </section>
    </div>
  )
}
