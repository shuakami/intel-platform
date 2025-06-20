"use client"

import type React from "react"

import { useState } from "react"
import { SquarePlus, Globe, Key, MessageSquareQuote, Loader2, Wand2, FolderUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import StatusIndicator from "./status-indicator"
import { analyzeIntelligence } from "@/lib/api"
import { useIntelStore, CrawlResultGroup, Report } from "@/lib/store"
import { marked } from "marked"

type PanelMode = "manual" | "auto" | "kb"

function getRegistrableDomain(hostname: string): string {
  const parts = hostname.split(".")
  // A simple heuristic to get the main domain, e.g., "ifeng.com" from "www.ifeng.com"
  // This may not work for complex TLDs like ".co.uk" but covers the user's case.
  if (parts.length > 2) {
    // Check for common TLDs that have two parts, like "com.cn", "org.cn"
    const secondLevelTlds = ["com", "net", "org", "gov"]
    if (secondLevelTlds.includes(parts[parts.length - 2]) && parts[parts.length - 1].length === 2) {
      return parts.slice(-3).join(".")
    }
    return parts.slice(-2).join(".")
  }
  return hostname
}

// Helper function for client-side crawling logic
async function executeClientSideCrawl(
  urls: string[],
  limitPerSite: number
): Promise<CrawlResultGroup[]> {
  console.log("[CRAWL] Starting client-side crawl. Initial URLs:", urls, "Limit per site:", limitPerSite)
  // 阶段1：初始页面抓取
  const initialReports = (await analyzeIntelligence(urls)) as Report[]
  console.log("[CRAWL] Phase 1: Initial scrape completed. Reports count:", initialReports.length)

  // 阶段2：从每个初始报告中提取链接，并应用限制
  const finalLinksToScrape = new Set<string>()
  const originMap = new Map<string, string>()

  initialReports.forEach((report) => {
    const reportUrl = report.url
    if (!reportUrl || !report.htmlContent) {
      console.log(`[CRAWL] Skipping report for ${reportUrl} due to missing URL or content.`)
      return
    }
    console.log(`[CRAWL] Phase 2: Processing report for ${reportUrl}`)

    const base = new URL(reportUrl)
    const baseDomain = getRegistrableDomain(base.hostname)
    console.log(`[CRAWL] Base domain for ${base.hostname} determined as: ${baseDomain}`)

    const linksForThisSite = new Set<string>()

    const parser = new DOMParser()
    const doc = parser.parseFromString(report.htmlContent, "text/html")

    doc.querySelectorAll("a").forEach((anchor) => {
      const href = anchor.getAttribute("href")
      if (!href) return

      try {
        const absoluteUrl = new URL(href, base.href)
        const linkDomain = getRegistrableDomain(absoluteUrl.hostname)
        const cleanUrl = absoluteUrl.href.split("#")[0]

        if (linkDomain === baseDomain) {
          if (cleanUrl !== reportUrl) {
            console.log(`[CRAWL] Found valid link: ${cleanUrl} (domain: ${linkDomain})`)
            linksForThisSite.add(cleanUrl)
          } else {
            console.log(`[CRAWL] Discarding link (same as report URL): ${cleanUrl}`)
          }
        } else {
          console.log(`[CRAWL] Discarding link (domain mismatch): ${cleanUrl} (base: ${baseDomain}, link: ${linkDomain})`)
        }
      } catch (e) {
        console.warn(`[CRAWL] Ignoring invalid URL found: ${href}`, e)
      }
    })

    console.log(`[CRAWL] Found ${linksForThisSite.size} valid unique links on ${reportUrl}. Applying limit of ${limitPerSite}.`)
    const limitedLinks = Array.from(linksForThisSite).slice(0, limitPerSite)
    limitedLinks.forEach((link) => {
      finalLinksToScrape.add(link)
      originMap.set(link, reportUrl)
    })
  })

  // 阶段3：二次抓取
  const linksArray = Array.from(finalLinksToScrape)
  console.log("[CRAWL] Phase 3: Starting secondary scrape for all found links. Total links:", linksArray.length)
  console.log("[CRAWL] Links to be scraped:", linksArray)
  const secondaryReports =
    linksArray.length > 0
      ? ((await analyzeIntelligence(linksArray)) as Report[])
      : []

  // 阶段4：结果分组
  const groupMap = new Map<string, Report[]>()
  initialReports.forEach((report) => {
    if (report.url) {
      groupMap.set(report.url, [report])
    }
  })
  secondaryReports.forEach((report) => {
    if (report.url) {
      const originUrl = originMap.get(report.url)
      if (originUrl && groupMap.has(originUrl)) {
        groupMap.get(originUrl)?.push(report)
      }
    }
  })

  return Array.from(groupMap.entries()).map(([startingUrl, reports]) => ({
    startingUrl,
    reports,
  }))
}

export default function IntelPanel() {
  const [url, setUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [crawlMode, setCrawlMode] = useState(false)
  const [crawlLimit, setCrawlLimit] = useState("5")
  const [panelMode, setPanelMode] = useState<PanelMode>("manual")
  const [autoQuery, setAutoQuery] = useState("")
  const {
    setAnalysisStatus,
    setReportData,
    reports,
    analysisStatus,
    setQaPanelOpen,
    setFinalReport,
    resetData,
  } = useIntelStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[PANEL] handleSubmit initiated. Calling resetData now.")
    resetData()

    if (panelMode === "manual" && !url.trim()) {
      alert("请输入目标网址。")
      return
    }
    if (panelMode === "auto" && !autoQuery.trim()) {
      alert("请输入您的分析需求。")
      return
    }

    if (apiKey.trim()) {
      localStorage.setItem("api_key", apiKey.trim())
    }

    setIsLoading(true)
    console.log("[PANEL] Setting analysisStatus to 'processing'.")
    setAnalysisStatus("processing")

    try {
      if (panelMode === "auto") {
        // AI 自动分析模式
        // 步骤 1: 获取规划
        const planRes = await fetch("/api/llm-handler", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: "plan", userPrompt: autoQuery }),
        })

        if (!planRes.ok) {
          const errorData = await planRes.json()
          throw new Error(
            `AI规划失败: ${errorData.error || planRes.statusText}`
          )
        }

        const plan = await planRes.json()
        const planUrls = plan.urls as string[]

        // 步骤 2: 执行抓取/爬取
        let intermediateData: Report[] | CrawlResultGroup[]
        let allReports: Report[] = []

        if (plan.mode === "crawl") {
          const resultGroups = await executeClientSideCrawl(planUrls, 10)
          intermediateData = resultGroups
          allReports = resultGroups.flatMap((group) => group.reports)
        } else {
          const reports = (await analyzeIntelligence(planUrls)) as Report[]
          intermediateData = reports
          allReports = reports
        }

        // 步骤 3: 综合报告
        const charLimitPerReport = 10000
        const markdownContent = allReports
          .map((r, index) => {
            if (!r.rawMarkdown || !r.url) return null
            let content = r.rawMarkdown
            if (content.length > charLimitPerReport) {
              content =
                content.substring(0, charLimitPerReport) +
                "\n\n... [内容已截断]\n"
            }
            // 为每个来源创建结构化块，以便AI可以准确引用
            return `[BEGIN SOURCE ${index + 1}]\nURL: ${
              r.url
            }\n\n${content}\n[END SOURCE ${index + 1}]`
          })
          .filter(Boolean)
          .join("\n\n---\n\n")

        if (!markdownContent.trim()) {
          throw new Error("未能从目标页面提取任何内容，无法生成综合报告。")
        }

        const synthesizeRes = await fetch("/api/llm-handler", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task: "synthesize",
            userPrompt: autoQuery,
            markdownContent: markdownContent,
          }),
        })

        if (!synthesizeRes.ok) {
          const errorData = await synthesizeRes.json()
          throw new Error(
            `AI综合报告生成失败: ${errorData.error || synthesizeRes.statusText}`
          )
        }

        const synthesisResult = await synthesizeRes.json()

        // 步骤 4: 设置最终报告和原始数据
        setFinalReport(
          synthesisResult.response,
          intermediateData,
          plan.mode,
          autoQuery
        )
      } else {
        // 手动模式
        const urls = url
          .split("\n")
          .filter((u) => u.trim() !== "")
          .map((u) => u.trim())

        if (urls.length === 0) {
          return
        }

        let invalidUrlFound = false
        urls.forEach((u) => {
          try {
            new URL(u)
          } catch {
            alert(`请输入有效的URL地址: ${u}`)
            invalidUrlFound = true
          }
        })

        if (invalidUrlFound) {
          return
        }

        if (crawlMode) {
          const limitPerSite = parseInt(crawlLimit, 10) || 5
          const resultGroups = await executeClientSideCrawl(urls, limitPerSite)
          setReportData(resultGroups, "crawl")
        } else {
          const data = await analyzeIntelligence(urls)
          setReportData(data, "scrape")
        }
        setQaPanelOpen(true)
      }
    } catch (error) {
      console.error("Analysis failed:", error)
      const message =
        error instanceof Error
          ? error.message
          : "分析失败，请检查URL或稍后重试"
      setAnalysisStatus("error")
      alert(message)
    } finally {
      setIsLoading(false)
    }

    setUrl("")
    setAutoQuery("")
    setCrawlMode(false)
  }

  const isCrawlDisabled = isLoading

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) {
      return
    }

    setIsLoading(true)
    setAnalysisStatus("processing")

    try {
      const newReports: Report[] = await Promise.all(
        Array.from(files).map(async (file, index) => {
          const content = await file.text()
          const htmlContent = await marked.parse(content)
          const reportData = await marked.parse(
            `## 文件内容分析\n\n- **文件名:** ${file.name}\n- **类型:** ${
              file.type || "未知"
            }\n- **大小:** ${(
              file.size / 1024
            ).toFixed(2)} KB\n\n文件已成功加载并准备好进行问答。`
          )

          return {
            url: file.name,
            title: `知识库文件: ${file.name}`,
            description: `文件大小: ${(file.size / 1024).toFixed(2)} KB`,
            language: "zh-CN",
            rawMarkdown: content,
            htmlContent,
            feedbackData: "",
            collectionData: "",
            reportData,
          }
        })
      )

      setReportData(
        [...useIntelStore.getState().reports, ...newReports],
        "scrape"
      )
      setQaPanelOpen(true)
    } catch (err) {
      alert("读取文件时发生错误。")
      console.error(err)
    } finally {
      setIsLoading(false)
      setAnalysisStatus("active")
    }

    // Reset file input so user can upload the same file again
    e.target.value = ""
  }

  // Get API key from environment if available
  const envApiKey = process.env.NEXT_PUBLIC_API_KEY || ""

  return (
    <div className="intel-panel rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <StatusIndicator status="active" />
        <h2 className="intel-title text-xl">智瞻情报分析平台</h2>
        <div className="flex-1"></div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-cyan-400 font-mono uppercase tracking-wider">
            Status: Online
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="intel-button h-8 w-8 -mr-2"
            onClick={() => setShowApiKey(!showApiKey)}
            title="API密钥设置"
          >
            <Key className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <section className="print:hidden">
        <div className="p-1 flex bg-cyan-950/40 rounded-lg border border-cyan-800/40 w-full max-w-sm mb-8">
          <Button
            variant="ghost"
            className={`w-1/3 rounded-md py-2 text-sm font-semibold transition-colors h-auto flex items-center justify-center gap-2 ${
              panelMode === "manual"
                ? "bg-cyan-600 text-white shadow"
                : "text-cyan-300 hover:bg-cyan-800/50 hover:text-white"
            }`}
            onClick={() => setPanelMode("manual")}
          >
            <Globe className="w-4 h-4" />
            手动分析
          </Button>
          <Button
            variant="ghost"
            className={`w-1/3 rounded-md py-2 text-sm font-semibold transition-colors h-auto flex items-center justify-center gap-2 ${
              panelMode === "auto"
                ? "bg-cyan-600 text-white shadow"
                : "text-cyan-300 hover:bg-cyan-800/50 hover:text-white"
            }`}
            onClick={() => setPanelMode("auto")}
          >
            <Wand2 className="w-4 h-4" />
            AI 自动分析
          </Button>
          <Button
            variant="ghost"
            className={`w-1/3 rounded-md py-2 text-sm font-semibold transition-colors h-auto flex items-center justify-center gap-2 ${
              panelMode === "kb"
                ? "bg-cyan-600 text-white shadow"
                : "text-cyan-300 hover:bg-cyan-800/50 hover:text-white"
            }`}
            onClick={() => setPanelMode("kb")}
          >
            <FolderUp className="w-4 h-4" />
            知识库分析
          </Button>
        </div>

        {showApiKey && (
          <div className="mb-6 space-y-2 rounded-lg border border-cyan-800/40 bg-cyan-950/30 p-4">
            <label
              className="flex items-center gap-2 text-sm font-semibold text-cyan-300 font-mono uppercase tracking-wide"
              htmlFor="api-key"
            >
              <Key className="w-4 h-4" />
              API密钥
            </label>
            <Input
              className="flex w-full border-input bg-transparent px-3 py-2 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm intel-input border-0 focus:ring-2 focus:ring-cyan-400/50 rounded-lg text-sm"
              type="password"
              placeholder="输入API密钥（Bearer Token）"
              name="apiKey"
              id="api-key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isLoading}
              autoComplete="off"
            />
            <div className="text-xs text-cyan-400/70 pt-1">
              {envApiKey
                ? "已配置环境变量API密钥，此处输入将覆盖环境变量"
                : "未配置环境变量API密钥，请在此处输入"}
            </div>
          </div>
        )}

        {isLoading && crawlMode && (
          <div className="my-4 p-4 bg-cyan-900/30 border border-cyan-700/50 rounded-lg text-center">
            <div className="flex items-center justify-center gap-3 text-cyan-300">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p className="font-semibold">追踪爬取模式已启动...</p>
            </div>
            <p className="text-xs text-cyan-400/80 mt-2">
              正在从起始URL开始深度分析整个网站，请耐心等待...
            </p>
          </div>
        )}

        {panelMode === "manual" ? (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 mb-3 text-sm font-semibold text-cyan-300 font-mono uppercase tracking-wide"
                htmlFor="target-url"
              >
                <Globe className="w-4 h-4" />
                目标网址
              </label>
              <Textarea
                className="flex min-h-[60px] w-full border-input bg-transparent px-3 py-2 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm intel-input border-0 focus:ring-2 focus:ring-cyan-400/50 rounded-lg text-sm"
                rows={5}
                placeholder="请输入一个或多个网址，每行一个。"
                name="url"
                id="target-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
              />
              <div className="text-xs text-cyan-400/70 mt-1">支持批量分析，每行输入一个网址。</div>
              <div className="flex items-start space-x-3 mt-4 pt-2">
                <Switch
                  id="crawl-mode"
                  checked={crawlMode}
                  onCheckedChange={setCrawlMode}
                  disabled={isCrawlDisabled}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-snug">
                  <Label
                    htmlFor="crawl-mode"
                    className={`text-sm font-medium text-cyan-300 ${isCrawlDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    追踪爬取模式
                  </Label>
                  <p className="text-xs text-cyan-400/70">
                    启用后将从每个URL开始深度爬取其所在网站。支持输入多个起始URL。
                  </p>
                </div>
              </div>
              {crawlMode && (
                <div className="mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="crawl-limit" className="text-xs font-mono text-cyan-400">
                      页面限制 (Limit)
                    </Label>
                    <Input
                      id="crawl-limit"
                      type="number"
                      value={crawlLimit}
                      onChange={(e) => setCrawlLimit(e.target.value)}
                      className="intel-input bg-cyan-950/50 border-cyan-800/60 h-9"
                      placeholder="例如: 50"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-cyan-400/70">
                     每个站点最多分析的链接数量。
                    </p>
                  </div>
                </div>
              )}
            </div>
            <Button
              className="w-full mt-6 intel-button py-3 rounded-lg font-mono uppercase tracking-wider text-sm font-semibold"
              type="submit"
              disabled={isLoading}
            >
              <span className="flex items-center gap-2">
                <span>{isLoading ? "⏳" : "▶"}</span>
                <span>
                  {isLoading
                    ? crawlMode
                      ? "正在追踪爬取..."
                      : "正在爬取分析..."
                    : "开始爬取分析"}
                </span>
              </span>
            </Button>
          </form>
        ) : panelMode === "auto" ? (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 mb-3 text-sm font-semibold text-cyan-300 font-mono uppercase tracking-wide"
                htmlFor="auto-query"
              >
                <Wand2 className="w-4 h-4" />
                您的分析需求
              </label>
              <Textarea
                className="flex min-h-[120px] w-full border-input bg-transparent px-3 py-2 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm intel-input border-0 focus:ring-2 focus:ring-cyan-400/50 rounded-lg text-sm"
                rows={5}
                placeholder="例如：帮我分析一下NVIDIA最新的GB200芯片的相关新闻和技术评测。"
                name="auto-query"
                id="auto-query"
                value={autoQuery}
                onChange={(e) => setAutoQuery(e.target.value)}
                disabled={isLoading}
              />
              <div className="text-xs text-cyan-400/70 mt-1">
                请用自然语言描述您的情报分析需求，AI将为您自动规划并执行。
              </div>
            </div>
            <Button
              className="w-full mt-6 intel-button py-3 rounded-lg font-mono uppercase tracking-wider text-sm font-semibold"
              type="submit"
              disabled={isLoading || !autoQuery.trim()}
            >
              <span className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                <span>{isLoading ? "AI正在规划分析..." : "开始自动分析"}</span>
              </span>
            </Button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
               <label
                className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 mb-3 text-sm font-semibold text-cyan-300 font-mono uppercase tracking-wide"
                htmlFor="kb-upload"
              >
                <FolderUp className="w-4 h-4" />
                上传本地文件
              </label>
              <div className="relative flex items-center justify-center w-full">
                <label
                  htmlFor="kb-upload-input"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-cyan-800/50 border-dashed rounded-lg cursor-pointer bg-black/20 hover:bg-black/40 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FolderUp className="w-10 h-10 mb-3 text-cyan-400/80" />
                    <p className="mb-2 text-sm text-cyan-300/90">
                      <span className="font-semibold">点击上传</span> 或拖拽文件到此区域
                    </p>
                    <p className="text-xs text-cyan-400/70">
                      支持 Markdown, TXT, JSON, CSV 等文本文件
                    </p>
                  </div>
                   <input
                    id="kb-upload-input"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".md,.txt,.json,.csv,.js,.ts,.py,.html,.css"
                    disabled={isLoading}
                    multiple
                  />
                </label>
              </div>
               <div className="text-xs text-cyan-400/70 mt-1">
                文件内容将在本地处理，不会上传到服务器，可放心使用。
              </div>
            </div>
            {isLoading && (
               <div className="flex items-center justify-center text-cyan-300">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  正在读取并分析文件...
               </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
