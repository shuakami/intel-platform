"use client"

import StatusIndicator from "./status-indicator"
import { useIntelStore } from "@/lib/store"

export default function DataCards() {
  const { analysisStatus, feedbackData, collectionData, title, url } = useIntelStore()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="data-card rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <StatusIndicator status={analysisStatus === "active" ? "processing" : "standby"} />
          <h3 className="text-lg font-semibold text-cyan-300">内容分析</h3>
        </div>
        <section className="p-4 intel-section border rounded-md mt-4 print:hidden">
          <h3 className="font-semibold text-lg border-b border-cyan-800/30 mb-2 leading-10 text-cyan-300">
            2. 页面内容解析
          </h3>
          <div className="text-sm">
            {analysisStatus === "active" && feedbackData ? (
              <>
                {title && (
                  <div className="mb-3 p-2 bg-cyan-900/20 rounded border border-cyan-800/30">
                    <div className="text-xs text-cyan-400 mb-1">页面标题</div>
                    <div className="text-cyan-300 font-medium">{title}</div>
                  </div>
                )}
                {url && (
                  <div className="mb-3 p-2 bg-cyan-900/20 rounded border border-cyan-800/30">
                    <div className="text-xs text-cyan-400 mb-1">目标URL</div>
                    <div className="text-cyan-300 text-xs break-all">{url}</div>
                  </div>
                )}
                <div className="prose prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: feedbackData }} />
                </div>
              </>
            ) : (
              <div className="text-gray-400">等待网页内容分析...</div>
            )}
          </div>
        </section>
      </div>

      <div className="data-card rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <StatusIndicator status={analysisStatus === "active" ? "active" : "standby"} />
          <h3 className="text-lg font-semibold text-cyan-300">数据收集</h3>
        </div>
        <section className="p-4 intel-section border rounded-md mt-4 print:hidden">
          <h3 className="font-semibold text-lg border-b border-cyan-800/30 mb-2 leading-10 text-cyan-300">
            3. 爬取数据统计
          </h3>
          <div className="text-sm">
            {analysisStatus === "active" && collectionData ? (
              <div className="prose prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: collectionData }} />
              </div>
            ) : (
              <div className="text-gray-400">等待数据收集完成...</div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
