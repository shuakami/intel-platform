"use client"

import { marked } from "marked"
import StatusIndicator from "./status-indicator"
import { useIntelStore, Report, CrawlResultGroup } from "@/lib/store"
import { sanitizeHtmlContent } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Download,
  FileText,
  BarChart3,
  MessageSquareQuote,
  Wand2,
  ChevronDown,
  ChevronRight,
  X,
  FileSignature,
  FileCode,
} from "lucide-react"
import { useState, useRef, useEffect, useMemo } from "react"
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  ExternalHyperlink,
  IStylesOptions,
  IRunOptions,
} from "docx"
import { saveAs } from "file-saver"

const docStyles: IStylesOptions = {
    paragraphStyles: [
        {
            id: "Normal",
            name: "Normal",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: { font: "Calibri", size: 22 }, // 11pt
            paragraph: { spacing: { after: 120 } }, // 6pt
        },
        {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: { font: "Calibri", size: 32, bold: true, color: "2E74B5" }, // 16pt, dark blue
            paragraph: { spacing: { before: 240, after: 120 } },
        },
        {
            id: "Heading2",
            name: "Heading 2",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: { font: "Calibri", size: 26, bold: true, color: "2E74B5" }, // 13pt
            paragraph: { spacing: { before: 240, after: 120 } },
        },
        {
            id: "Heading3",
            name: "Heading 3",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: { font: "Calibri", size: 24, bold: true, color: "5B9BD5" }, // 12pt, light blue
            paragraph: { spacing: { before: 120, after: 80 } },
        },
         {
            id: "ListParagraph",
            name: "List Paragraph",
            basedOn: "Normal",
            quickFormat: true,
            paragraph: {
                indent: { left: 720 },
                spacing: { after: 80 }
            },
        },
    ],
    characterStyles: [
        {
            id: 'Hyperlink',
            name: 'Hyperlink',
            basedOn: 'DefaultParagraphFont',
            run: {
                color: '0000FF',
                underline: {
                    type: 'single',
                    color: '0000FF',
                },
            },
        },
    ],
};

const robustHtmlToDocx = (htmlString: string): Paragraph[] => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlString, "text/html")
  const paragraphs: Paragraph[] = []

  const processRuns = (
    node: ChildNode,
    style: IRunOptions = {}
  ): (TextRun | ExternalHyperlink)[] => {
    if (node.nodeType === Node.TEXT_NODE) {
      return [new TextRun({ text: (node as Text).textContent || "", ...style })]
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      let newStyle = { ...style }
      if (el.nodeName === "STRONG" || el.nodeName === "B") newStyle.bold = true
      if (el.nodeName === "EM" || el.nodeName === "I") newStyle.italics = true
      if (el.nodeName === "A") newStyle.style = "Hyperlink"

      const children = Array.from(el.childNodes).flatMap((child) =>
        processRuns(child, newStyle)
      )

      if (el.nodeName === "A") {
        return [
          new ExternalHyperlink({
            children: children.filter(
              (r): r is TextRun => r instanceof TextRun
            ),
            link: (el as HTMLAnchorElement).href,
          }),
        ]
      }
      return children
    }

    return []
  }

  // Processes block-level elements from the parsed HTML body
  const processBlockLevelElements = (node: ChildNode) => {
    switch (node.nodeName) {
      case "H1":
      case "H2":
      case "H3":
      case "H4":
      case "H5":
      case "H6":
        paragraphs.push(
          new Paragraph({
            style: `Heading${node.nodeName.charAt(1)}`,
            children: processRuns(node),
          })
        )
        break
      case "P":
        paragraphs.push(
          new Paragraph({ style: "Normal", children: processRuns(node) })
        )
        break
      case "UL":
      case "OL":
        ;(node as HTMLElement).querySelectorAll("li").forEach((li) => {
          paragraphs.push(
            new Paragraph({
              style: "ListParagraph",
              bullet: { level: 0 },
              children: processRuns(li),
            })
          )
        })
        break
      default:
        // If it's not a recognized block element, but it is an element, process its children.
        if (node.nodeType === Node.ELEMENT_NODE) {
          Array.from(node.childNodes).forEach(processBlockLevelElements)
        }
    }
  }

  Array.from(doc.body.childNodes).forEach(processBlockLevelElements)
  return paragraphs
}

function FinalReportBlock({ reportContent }: { reportContent: string }) {
  const [showRaw, setShowRaw] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const { reports, crawlReportGroups } = useIntelStore()

  const allReports = useMemo((): Report[] => {
    const directReports = reports || []
    const crawledReports =
      crawlReportGroups?.flatMap((group) => group.reports) || []
    // Simple way to combine and deduplicate if necessary, assuming URL is a unique key
    const combined = [...directReports, ...crawledReports]
    const uniqueReports = Array.from(new Map(combined.map(item => [item.url, item])).values());
    return uniqueReports
  }, [reports, crawlReportGroups])

  const { processedHtml, usedSources, cleanedContent } = useMemo(() => {
    // 1. Remove markdown code fences
    let content = reportContent
      .replace(/^`{3}markdown\s*\n/i, "")
      .replace(/\n`{3}$/, "")
      .trim()

    // 2. Remove the LLM-generated reference list to avoid conflicts
    // This regex handles "参考资料" or a "---" separator followed by source definitions
    content = content.replace(/(\n\n参考资料.*|\n\n---\n\n\[source.+)/s, "")

    const usedSources = new Map<string, string>()

    // 3. Replace source citations with hyperlinks
    const contentWithLinks = content.replace(
      /\[source (\d+)\]/gi,
      (match, sourceIdStr) => {
        const sourceId = parseInt(sourceIdStr, 10)
        if (sourceId > 0 && sourceId <= allReports.length) {
          const report = allReports[sourceId - 1]
          if (report && report.url) {
            usedSources.set(sourceIdStr, report.url)
            // Use the correct class name "source-citation"
            return `<a href="${report.url}" target="_blank" rel="noopener noreferrer" class="source-citation">[source ${sourceId}]</a>`
          }
        }
        return match // Return original match if source not found
      }
    )

    // 4. Parse the processed markdown to HTML
    let html = marked.parse(contentWithLinks, {
      breaks: true,
      gfm: true,
    }) as string

    return { processedHtml: html, usedSources, cleanedContent: content }
  }, [reportContent, allReports])

  const downloadMarkdown = (content: string) => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
    saveAs(blob, "ai-synthesized-report.md")
  }

  const downloadDocx = async (htmlContent: string, sources: Map<string, string>) => {
    const docChildren = robustHtmlToDocx(htmlContent);

    if (sources.size > 0) {
        docChildren.push(new Paragraph({ text: "\n", spacing: { after: 400 } }));
        docChildren.push(new Paragraph({ text: "来源网站汇总", style: "Heading2" }));
        sources.forEach((url, id) => {
            docChildren.push(new Paragraph({
                style: "Normal",
                children: [
                    new TextRun(`source ${id}: `),
                    new ExternalHyperlink({
                        children: [
                            new TextRun({
                                text: url,
                                style: "Hyperlink",
                            }),
                        ],
                        link: url,
                    }),
                ],
            }));
        });
    }

    const doc = new Document({
      sections: [{ children: docChildren }],
      styles: docStyles,
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, "ai-synthesized-report.docx")
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
            variant="outline"
            size="sm"
            className="intel-button text-xs border-cyan-600 hover:bg-cyan-700/50"
            onClick={() => downloadMarkdown(cleanedContent)}
          >
            <FileCode className="w-3 h-3 mr-1" />
            下载MD
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="intel-button text-xs border-cyan-600 hover:bg-cyan-700/50"
            onClick={() => downloadDocx(processedHtml, usedSources)}
          >
            <FileSignature className="w-3 h-3 mr-1" />
            下载Word
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

      {usedSources.size > 0 && !showRaw && (
        <section className="mt-6">
          <h3 className="text-lg font-semibold text-cyan-300 mb-3">来源网站汇总</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {Array.from(usedSources.entries()).map(([id, url]) => (
              <div key={id} className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-xs w-20">{`[source ${id}]`}</span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 truncate"
                  title={url}
                >
                  {url}
                </a>
              </div>
            ))}
          </div>
        </section>
      )}
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
  const { analysisStatus, setQaPanelOpen, removeReport } = useIntelStore()
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

  const downloadWord = async (html: string | null, title: string | null) => {
    if (!html) return

    const doc = new Document({
      sections: [{ children: robustHtmlToDocx(html) }],
      styles: docStyles,
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${title || "scraped-content"}.docx`);
  };

  const isKnowledgeBaseFile = report.title?.startsWith("知识库文件:")

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
                下载MD
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="intel-button text-xs"
                onClick={() => downloadWord(report.reportData, report.title)}
              >
                <FileSignature className="w-3 h-3 mr-1" />
                下载Word
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
          {isKnowledgeBaseFile && (
            <Button
              variant="ghost"
              size="sm"
              className="intel-button text-xs text-red-400 hover:bg-red-900/50 hover:text-red-300"
              onClick={() => removeReport(report.url!)}
              title="删除此文件"
            >
              <X className="w-3 h-3 mr-1" />
              删除
            </Button>
          )}
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
            <span>CLASSIFIED</span>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      <section className="intel-section border border-cyan-800/30 rounded-md p-4 bg-black/20 mt-4">
        {showAnalysis ? (
          <div
            className="prose prose-invert max-w-none break-words prose-p:leading-relaxed prose-headings:text-cyan-300 prose-a:text-cyan-400 hover:prose-a:text-cyan-300 prose-strong:text-white prose-blockquote:border-cyan-700 prose-blockquote:pl-4 prose-blockquote:italic"
            dangerouslySetInnerHTML={{ __html: report.reportData || "" }}
          />
        ) : (
          <div
            className="scraped-content-container"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtmlContent(report.htmlContent),
            }}
          />
        )}
      </section>
    </div>
  )
}

function CrawlGroupBlock({
  group,
  groupIndex,
}: {
  group: CrawlResultGroup
  groupIndex: number
}) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="intel-panel-item bg-slate-900/50 border border-slate-800 rounded-lg p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center w-full text-left text-lg font-semibold text-cyan-200"
      >
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 mr-2" />
        ) : (
          <ChevronRight className="w-5 h-5 mr-2" />
        )}
        爬取组 #{groupIndex + 1}:{" "}
        <span className="ml-2 text-cyan-400 truncate">{group.startingUrl}</span>
      </button>
      {isExpanded && (
        <div className="mt-4 pl-7 space-y-4 border-l-2 border-dashed border-slate-700 ml-2">
          {group.reports.map((report, index) => (
            <ReportBlock
              key={report.url || index}
              report={report}
              index={index}
              isGrouped
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ReportPanel() {
  const {
    analysisStatus,
    reports,
    crawlReportGroups,
    finalReport,
    autoQuery,
  } = useIntelStore()

  const downloadFullReport = () => {
    // 1. Get the final AI report markdown
    const finalReportMarkdown = finalReport
      ? `# AI 综合分析报告\n\n**原始查询:** ${autoQuery}\n\n${finalReport}`
      : ""

    // 2. Get all individual source markdowns
    const allReports = [...reports, ...crawlReportGroups.flatMap(g => g.reports)];
    const sourcesMarkdown = allReports
      .map(
        (r, i) =>
          `---\n\n## 来源 ${i + 1}: ${r.url || "N/A"}\n\n${
            r.rawMarkdown || "无内容"
          }`
      )
      .join("\n\n")

    // 3. Combine them
    const fullContent = `${finalReportMarkdown}\n\n# 原始数据来源\n\n${sourcesMarkdown}`

    const blob = new Blob([fullContent], { type: "text/markdown;charset=utf-8" })
    saveAs(blob, "full-intelligence-report.md")
  }

  const downloadFullReportAsWord = async () => {
    const docChildren: Paragraph[] = [];

    // 1. Add AI-synthesized report if available
    if (finalReport) {
      docChildren.push(new Paragraph({ text: "AI 综合分析报告", style: "Heading1" }));
      if (autoQuery) {
        docChildren.push(new Paragraph({ text: `原始查询: ${autoQuery}`, style: "Normal" }));
      }
      const finalReportHtml = marked.parse(finalReport) as string;
      docChildren.push(...robustHtmlToDocx(finalReportHtml));
      docChildren.push(new Paragraph({ text: "" })); // Add a spacer
    }

    const allReports = [...reports, ...crawlReportGroups.flatMap(g => g.reports)];

    // 2. Add raw data section if any raw data exists
    if (allReports.length > 0) {
      docChildren.push(new Paragraph({ text: "原始数据来源", style: "Heading1" }));
    }

    allReports.forEach((report, i) => {
      docChildren.push(new Paragraph({ text: `来源 ${i + 1}: ${report.url || "N/A"}`, style: "Heading2" }));
      if (report.rawMarkdown) {
        const reportHtml = marked.parse(report.rawMarkdown) as string;
        docChildren.push(...robustHtmlToDocx(reportHtml));
      } else {
        docChildren.push(new Paragraph({ text: "无内容", style: "Normal" }));
      }
      docChildren.push(new Paragraph({ text: "" })); // Add a spacer
    });
    
    const doc = new Document({
        sections: [{ children: docChildren }],
        styles: docStyles,
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "full-intelligence-report.docx");
  };

  if (analysisStatus === "idle") {
    return (
      <div className="flex-center h-full text-slate-500">
        <p>请在左侧面板输入网址或分析需求以开始。</p>
      </div>
    )
  }

  if (analysisStatus === "processing") {
    return <StatusIndicator status="processing" />
  }

  if (analysisStatus === "error") {
    return <StatusIndicator status="error" />
  }

  const hasData =
    reports.length > 0 || crawlReportGroups.length > 0 || finalReport

  if (analysisStatus === "active" && !hasData) {
    return (
      <div className="flex-center h-full text-slate-500">
        <p>未能获取到任何数据。</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {finalReport && <FinalReportBlock reportContent={finalReport} />}

      {crawlReportGroups.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-300 px-2">原始爬取数据</h2>
          {crawlReportGroups.map((group, index) => (
            <CrawlGroupBlock
              key={group.startingUrl}
              group={group}
              groupIndex={index}
            />
          ))}
        </div>
      )}

      {reports.length > 0 && (
        <div className="space-y-4">
           <h2 className="text-xl font-bold text-slate-300 px-2">原始抓取数据</h2>
          {reports.map((report, index) => (
            <ReportBlock
              key={report.url || index}
              report={report}
              index={index}
            />
          ))}
        </div>
      )}

      {(reports.length > 0 || crawlReportGroups.length > 0) && (
        <div className="text-center pt-4 flex justify-center items-center gap-4">
          <Button onClick={downloadFullReport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            下载完整报告 (MD)
          </Button>
           <Button onClick={downloadFullReportAsWord} variant="outline" size="sm">
            <FileSignature className="w-4 h-4 mr-2" />
            下载完整报告 (Word)
          </Button>
        </div>
      )}
    </div>
  )
}
