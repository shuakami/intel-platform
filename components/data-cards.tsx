"use client"

import StatusIndicator from "./status-indicator"
import { useIntelStore, Report } from "@/lib/store"
import { MessageSquareQuote, AlertTriangle } from "lucide-react"
import { Button } from "./ui/button"

function ReportCard({ report, index }: { report: Report; index: number }) {
  const { analysisStatus } = useIntelStore()
  return (
    <div className="data-card rounded-lg p-6 bg-black/20 ring-1 ring-cyan-800/20">
      <h2
        className="text-lg font-bold text-cyan-200 truncate mb-4"
        title={report.url || ""}
      >
        页面 #{index + 1}: {report.title || report.url}
      </h2>

      {report.error ? (
        <div className="rounded-lg bg-red-900/20 border border-red-500/30 p-6 text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-red-300">分析失败</h3>
          <p className="text-sm text-red-400/80 mt-2 mb-4 break-all">
            无法处理URL: {report.url}
          </p>
          <div className="text-sm bg-black/20 p-3 rounded-md text-left font-mono text-red-400/70">
            <p className="font-bold">错误详情:</p>
            <p>{report.error}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <StatusIndicator
                status={analysisStatus === "active" ? "processing" : "standby"}
              />
              <h3 className="text-lg font-semibold text-cyan-300">内容分析</h3>
            </div>
            <section className="p-4 intel-section border rounded-md mt-4 print:hidden">
              <h3 className="font-semibold text-lg border-b border-cyan-800/30 mb-2 leading-10 text-cyan-300">
                2. 页面内容解析
              </h3>
              <div className="text-sm">
                {report.feedbackData ? (
                  <>
                    {report.title && (
                      <div className="mb-3 p-2 bg-cyan-900/20 rounded border border-cyan-800/30">
                        <div className="text-xs text-cyan-400 mb-1">
                          页面标题
                        </div>
                        <div className="text-cyan-300 font-medium">
                          {report.title}
                        </div>
                      </div>
                    )}
                    {report.url && (
                      <div className="mb-3 p-2 bg-cyan-900/20 rounded border border-cyan-800/30">
                        <div className="text-xs text-cyan-400 mb-1">
                          目标URL
                        </div>
                        <div className="text-cyan-300 text-xs break-all">
                          {report.url}
                        </div>
                      </div>
                    )}
                    <div className="prose prose-invert max-w-none">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: report.feedbackData,
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400">无可用数据</div>
                )}
              </div>
            </section>
          </div>

          <div className="rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <StatusIndicator
                status={analysisStatus === "active" ? "active" : "standby"}
              />
              <h3 className="text-lg font-semibold text-cyan-300">数据收集</h3>
            </div>
            <section className="p-4 intel-section border rounded-md mt-4 print:hidden">
              <h3 className="font-semibold text-lg border-b border-cyan-800/30 mb-2 leading-10 text-cyan-300">
                3. 爬取数据统计
              </h3>
              <div className="text-sm">
                {report.collectionData ? (
                  <div className="prose prose-invert max-w-none">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: report.collectionData,
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-gray-400">无可用数据</div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DataCards() {
  const { analysisStatus, reports, analysisMode, crawlReportGroups } =
    useIntelStore()

  if (
    analysisStatus !== "active" ||
    (reports.length === 0 && crawlReportGroups.length === 0)
  ) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="data-card rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <StatusIndicator status={"standby"} />
            <h3 className="text-lg font-semibold text-cyan-300">内容分析</h3>
          </div>
          <section className="p-4 intel-section border rounded-md mt-4 print:hidden">
            <h3 className="font-semibold text-lg border-b border-cyan-800/30 mb-2 leading-10 text-cyan-300">
              2. 页面内容解析
            </h3>
            <div className="text-sm">
              <div className="text-gray-400">等待网页内容分析...</div>
            </div>
          </section>
        </div>
        <div className="data-card rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <StatusIndicator status={"standby"} />
            <h3 className="text-lg font-semibold text-cyan-300">数据收集</h3>
          </div>
          <section className="p-4 intel-section border rounded-md mt-4 print:hidden">
            <h3 className="font-semibold text-lg border-b border-cyan-800/30 mb-2 leading-10 text-cyan-300">
              3. 爬取数据统计
            </h3>
            <div className="text-sm">
              <div className="text-gray-400">等待数据收集完成...</div>
            </div>
          </section>
        </div>
      </div>
    )
  }

  if (analysisMode === "crawl") {
    return (
      <div className="flex flex-col gap-8">
        {crawlReportGroups.map((group, groupIndex) => (
          <div
            key={groupIndex}
            className="crawl-group-card rounded-lg p-6 bg-cyan-950/40 border border-cyan-800/30"
          >
            <div className="border-b border-cyan-800/50 pb-4 mb-6">
              <h2 className="text-xl font-bold text-cyan-200">
                追踪爬取报告:
                <span className="ml-2 font-mono text-cyan-300 break-all">
                  {group.startingUrl}
                </span>
              </h2>
              <p className="text-sm text-cyan-400 mt-2">
                从起始地址共发现并分析了{" "}
                <span className="font-bold text-white">
                  {group.reports.length}
                </span>{" "}
                个页面。
              </p>
            </div>
            <div className="flex flex-col gap-6">
              {group.reports.map((report, reportIndex) => (
                <ReportCard
                  key={reportIndex}
                  report={report}
                  index={reportIndex}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {reports.map((report, index) => (
        <ReportCard key={index} report={report} index={index} />
      ))}
    </div>
  )
}
