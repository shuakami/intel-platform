"use client"

import { marked } from "marked"
import StatusIndicator from "./status-indicator"
import { useIntelStore, Report } from "@/lib/store"
import { Button } from "@/components/ui/button"
import {
  Download,
  FileText,
  BarChart3,
  MessageSquareQuote,
  Wand2,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { useState, useRef, useEffect } from "react"

function FinalReportBlock({ reportContent }: { reportContent: string }) {
  const [showRaw, setShowRaw] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const cleanedContent = reportContent
    .replace(/^`{3}markdown\s*\n/i, "")
    .replace(/\n`{3}$/, "")
    .trim()

  // 1. Process citations before rendering
  const processedHtml = ((): string => {
    const renderer = new marked.Renderer()
    const originalLinkRenderer = renderer.link.bind(renderer)

    // Customize link rendering to style citations
    renderer.link = (link) => {
      const { href, text } = link
      // If the link text is "Source N", style it as a citation badge
      if (href && text.match(/^Source \d+$/)) {
        const sourceId = text.match(/\d+/)?.[0]
        if (sourceId) {
          // The link should point to an anchor in the reference list
          return `<a href="#ref-source-${sourceId}" class="source-citation" data-source-id="${sourceId}">[${text}]</a>`
        }
      }

      // For all other links, render them as normal external links that open in a new tab
      const originalLink = originalLinkRenderer(link) || ""
      return originalLink.replace(
        /^<a/,
        '<a target="_blank" rel="noopener noreferrer"'
      )
    }

    let html = marked.parse(cleanedContent, {
      renderer,
      breaks: true,
    }) as string

    // Add IDs to the reference list items for anchoring
    html = html.replace(/(<li>\s*\[Source (\d+)\]:)/g, (match, p1, p2) => {
      return `<li id="ref-source-${p2}">` + p1.substring(4)
    })

    return html
  })()

  // 2. Add smooth scrolling via event delegation
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.classList.contains("source-citation")) {
        event.preventDefault()
        const sourceId = target.getAttribute("data-source-id")
        const refElement = contentRef.current?.querySelector(
          `#ref-source-${sourceId}`
        )
        if (refElement) {
          refElement.scrollIntoView({ behavior: "smooth", block: "center" })
          // Optional: highlight the reference
          refElement.classList.add("highlight")
          setTimeout(() => refElement.classList.remove("highlight"), 1500)
        }
      }
    }

    const contentEl = contentRef.current
    contentEl?.addEventListener("click", handleClick)
    return () => contentEl?.removeEventListener("click", handleClick)
  }, [processedHtml]) // Re-attach if content changes

  const downloadMarkdown = (content: string) => {
    const blob = new Blob([content], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ai-synthesized-report.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="final-report-card rounded-lg p-6 bg-gradient-to-br from-cyan-900/80 to-slate-900/80 border border-cyan-700/50 shadow-lg">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-2 bg-cyan-400/20 rounded-full">
          <Wand2 className="w-6 h-6 text-cyan-300" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">AI 综合分析报告</h2>
          <p className="text-sm text-cyan-400">
            根据您的需求由AI自动规划、执行并生成的最终报告
          </p>
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="intel-button text-xs"
            onClick={() => setShowRaw(!showRaw)}
          >
            {showRaw ? (
              <>
                <FileText className="w-3 h-3 mr-1" />
                查看渲染视图
              </>
            ) : (
              <>
                <BarChart3 className="w-3 h-3 mr-1" />
                查看原始内容
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="intel-button text-xs"
            onClick={() => downloadMarkdown(cleanedContent)}
          >
            <Download className="w-3 h-3 mr-1" />
            下载报告
          </Button>
        </div>
      </div>
      <section className="intel-section border border-cyan-800/30 rounded-md p-4 bg-black/20">
        <div
          ref={contentRef}
          className="prose prose-invert max-w-none break-words prose-p:leading-relaxed prose-headings:text-cyan-300 prose-a:text-cyan-400 hover:prose-a:text-cyan-300 prose-strong:text-white prose-blockquote:border-cyan-700 prose-blockquote:pl-4 prose-blockquote:italic prose-hr:my-8 prose-hr:border-slate-700"
        >
          {showRaw ? (
            <pre className="whitespace-pre-wrap text-sm text-gray-300 bg-black/30 p-4 rounded-md overflow-x-auto">
              {cleanedContent}
            </pre>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
          )}
        </div>
      </section>
    </div>
  )
}

function ReportBlock({
  report,
  index,
  isGrouped = false,
}: {
  report: Report
  index: number
  isGrouped?: boolean
}) {
  const { analysisStatus, setQaPanelOpen } = useIntelStore()
  const [showAnalysis, setShowAnalysis] = useState(false)

  const downloadMarkdown = (markdown: string | null, title: string | null) => {
    if (!markdown) return

    const blob = new Blob([markdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title || "scraped-content"}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className={`intel-panel rounded-lg p-6 ${isGrouped ? "bg-black/20" : ""}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <StatusIndicator
          status={analysisStatus === "active" ? "active" : "standby"}
        />
        <h2
          className="text-xl font-semibold text-cyan-300 truncate"
          title={report.url || ""}
        >
          <span className="intel-text">
            {isGrouped ? `页面 #${index + 1}: ` : "爬取内容: "}
            {report.title || report.url}
          </span>
        </h2>
        <div className="flex-1"></div>
        <div className="flex items-center gap-2">
          {analysisStatus === "active" && report.rawMarkdown && (
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
              <Button
                variant="ghost"
                size="sm"
                className="intel-button text-xs"
                onClick={() =>
                  downloadMarkdown(report.rawMarkdown, report.title)
                }
              >
                <Download className="w-3 h-3 mr-1" />
                下载
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="intel-button text-xs"
                onClick={() => setQaPanelOpen(true)}
                title="智能问答"
              >
                <MessageSquareQuote className="w-3 h-3 mr-1" />
                智能问答
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
          {report.error ? (
            <div className="text-red-400 p-4 bg-red-900/20 rounded">
              <p className="font-bold">分析错误:</p>
              <p>{report.error}</p>
            </div>
          ) : showAnalysis && report.reportData ? (
            <div className="prose prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: report.reportData }} />
            </div>
          ) : report.htmlContent ? (
            <div className="prose prose-invert max-w-none">
              <div
                className="bg-black/10 p-4 rounded border border-cyan-800/30 max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: report.htmlContent }}
              />
            </div>
          ) : (
            <div className="text-gray-400">无可用预览</div>
          )}
        </div>
      </section>
    </div>
  )
}

export default function ReportPanel() {
  const {
    analysisStatus,
    reports,
    analysisMode,
    crawlReportGroups,
    finalReport,
  } = useIntelStore()
  const [showRawData, setShowRawData] = useState(false)

  const downloadFullReport = () => {
    let fullReportMd = `# 情报分析最终报告\n\n*生成于: ${new Date().toLocaleString()}*\n\n---\n\n`

    // 1. Add AI-synthesized report if available
    if (finalReport) {
      fullReportMd += "## AI 综合分析报告\n\n"
      const cleanedContent = finalReport
        .replace(/^`{3}markdown\s*\n/i, "")
        .replace(/\n`{3}$/, "")
        .trim()
      fullReportMd += `${cleanedContent}\n\n---\n\n`
    }

    const hasCrawlData = crawlReportGroups.length > 0
    const hasScrapeData = reports.length > 0

    // 2. Add raw data section if any raw data exists
    if (hasCrawlData || hasScrapeData) {
      fullReportMd += `## 原始抓取数据\n\n`
    }

    if (hasCrawlData) {
      crawlReportGroups.forEach((group) => {
        fullReportMd += `### 追踪爬取报告: ${group.startingUrl}\n\n`
        group.reports.forEach((report, index) => {
          fullReportMd += `#### 页面 ${index + 1}: ${report.title || "无标题"}\n`
          fullReportMd += `**URL:** ${report.url || "N/A"}\n\n`
          if (report.error) {
            fullReportMd += `**错误:** 分析失败。 ${report.error}\n\n`
          } else {
            fullReportMd += `**内容:**\n\n---\n\n${report.rawMarkdown || "无内容"}\n\n---\n\n`
          }
        })
      })
    } else if (hasScrapeData) {
      fullReportMd += `### 网页抓取报告\n\n`
      reports.forEach((report, index) => {
        fullReportMd += `#### 页面 ${index + 1}: ${report.title || "无标题"}\n`
        fullReportMd += `**URL:** ${report.url || "N/A"}\n\n`
        if (report.error) {
          fullReportMd += `**错误:** 分析失败。 ${report.error}\n\n`
        } else {
          fullReportMd += `**内容:**\n\n---\n\n${report.rawMarkdown || "无内容"}\n\n---\n\n`
        }
      })
    }

    const blob = new Blob([fullReportMd], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `intelligence-report-${Date.now()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (
    analysisStatus !== "active" ||
    (reports.length === 0 && crawlReportGroups.length === 0 && !finalReport)
  ) {
    return (
      <div className="intel-panel rounded-lg p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <StatusIndicator status="standby" />
          <h2 className="text-xl font-semibold text-cyan-300">
            <span className="intel-text">爬取内容</span>
          </h2>
        </div>
        <section className="intel-section border rounded-md p-4 print:border-none">
          <h3 className="font-semibold text-lg border-b border-cyan-800/30 mb-2 leading-10 print:hidden text-cyan-300">
            4. 网页原始内容
          </h3>
          <div className="text-sm">
            <div className="text-gray-400">等待网页内容爬取...</div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">分析结果</h1>
        <Button onClick={downloadFullReport}>
          <Download className="mr-2 h-4 w-4" />
          下载最终报告
        </Button>
      </div>

      {analysisMode === "report" && finalReport && (
        <FinalReportBlock reportContent={finalReport} />
      )}

      {(analysisMode === "report" &&
        (crawlReportGroups.length > 0 || reports.length > 0)) && (
        <div className="mt-8 border-t border-cyan-800/30 pt-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">原始抓取数据</h2>
            <Button
              variant="ghost"
              className="intel-button text-cyan-300"
              onClick={() => setShowRawData(!showRawData)}
            >
              {showRawData ? (
                <ChevronDown className="w-4 h-4 mr-2" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-2" />
              )}
              {showRawData ? "隐藏详情" : "查看详情"}
            </Button>
          </div>
        </div>
      )}

      {analysisMode === "crawl" ||
      (analysisMode === "report" &&
        showRawData &&
        crawlReportGroups.length > 0) ? (
        <div className="flex flex-col gap-8">
          {crawlReportGroups.map((group, groupIndex) => (
            <div
              key={groupIndex}
              className="crawl-group-card rounded-lg p-6 bg-cyan-950/40 border border-cyan-800/30"
            >
              <div className="border-b border-cyan-800/50 pb-4 mb-6">
                <h2 className="text-2xl font-bold text-cyan-200">
                  追踪爬取报告:
                  <span className="ml-2 font-mono text-cyan-300 break-all">
                    {group.startingUrl}
                  </span>
                </h2>
              </div>
              <div className="flex flex-col gap-6">
                {group.reports.map((report, reportIndex) => (
                  <ReportBlock
                    key={reportIndex}
                    report={report}
                    index={reportIndex}
                    isGrouped={true}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {analysisMode === "scrape" ||
      (analysisMode === "report" && showRawData && reports.length > 0) ? (
        <div className="flex flex-col gap-8">
          {reports.map((report, index) => (
            <ReportBlock key={index} report={report} index={index} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
