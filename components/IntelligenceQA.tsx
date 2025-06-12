"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertCircle, Bot } from "lucide-react"
import { useIntelStore } from "@/lib/store"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function IntelligenceQA() {
  const {
    reports,
    analysisStatus,
    isQaPanelOpen,
    setQaPanelOpen,
    analysisMode,
    crawlReportGroups,
  } = useIntelStore()
  const [question, setQuestion] = useState("")
  const [conversation, setConversation] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([
    {
      role: "assistant",
      content:
        "你好！我已经学习并分析了你提供的所有网页内容。现在，你可以就这些内容向我提问了。",
    },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const conversationEndRef = useRef<HTMLDivElement>(null)

  const { combinedMarkdown, sourceCount } = useMemo(() => {
    let markdown = ""
    let count = 0

    if (analysisMode === "crawl") {
      markdown =
        crawlReportGroups
          .flatMap((group) => group.reports)
          .map((r) => r.rawMarkdown)
          .filter((md): md is string => !!md)
          .join("\n\n---\n\n")
      count = crawlReportGroups.reduce(
        (acc, group) => acc + group.reports.length,
        0
      )
    } else {
      markdown =
        reports
          .map((r) => r.rawMarkdown)
          .filter((md): md is string => !!md)
          .join("\n\n---\n\n")
      count = reports.length
    }
    return { combinedMarkdown: markdown, sourceCount: count }
  }, [analysisMode, reports, crawlReportGroups])

  useEffect(() => {
    if (
      analysisStatus === "active" &&
      (reports.length > 0 || crawlReportGroups.length > 0) &&
      analysisMode !== "report"
    ) {
      setQaPanelOpen(true)
    }
  }, [
    analysisStatus,
    reports,
    crawlReportGroups,
    setQaPanelOpen,
    analysisMode,
  ])

  useEffect(() => {
    console.log(
      `[QA] Reset-Effect triggered. Status: ${analysisStatus}, Reports: ${reports.length}, Groups: ${crawlReportGroups.length}`
    )
    // When a new analysis starts (processing), or when data is cleared,
    // or when the component is reset to its initial state (idle),
    if (
      analysisStatus === "idle" ||
      analysisStatus === "processing" ||
      (reports.length === 0 && crawlReportGroups.length === 0)
    ) {
      console.log("[QA] Conditions met. Resetting conversation.")
      setConversation([
        {
          role: "assistant",
          content:
            "你好！我已经学习并分析了你提供的所有网页内容。现在，你可以就这些内容向我提问了。",
        },
      ])
      setError(null)
      setLoading(false)
    }
  }, [analysisStatus, reports, crawlReportGroups])

  const handleAsk = async () => {
    if (!question.trim() || !combinedMarkdown) return
    const currentQuestion = question.trim()
    setLoading(true)
    setError("")
    setConversation(prev => [...prev, { role: "user", content: currentQuestion }])
    setQuestion("")

    try {
      const res = await fetch("/api/llm-handler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdownContent: combinedMarkdown,
          userPrompt: currentQuestion,
        }),
      })
      const data = await res.json()
      if (data.response) {
        setConversation(prev => [
          ...prev,
          { role: "assistant", content: data.response },
        ])
      } else {
        const errorMessage =
          data.error || "LLM未返回有效内容，请检查API配置或稍后再试。"
        setError(errorMessage)
        setConversation(prev => [
          ...prev,
          { role: "assistant", content: `错误: ${errorMessage}` },
        ])
      }
    } catch (e: any) {
      const errorMessage =
        e.message || "与LLM通信失败，请检查网络或API服务。"
      setError(errorMessage)
      setConversation(prev => [
        ...prev,
        { role: "assistant", content: `错误: ${errorMessage}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Focus input when dialog opens or conversation updates (for quick follow-up)
  useEffect(() => {
    if (isQaPanelOpen && !loading && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isQaPanelOpen, loading, conversation])

  // Scroll to the end of conversation when new messages are added
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation])

  const handleDialogClose = (isOpen: boolean) => {
    // This function is called by Radix Dialog onOpenChange
    if (!isOpen) {
      setQaPanelOpen(false)
    }
  }

  return (
    <Dialog open={isQaPanelOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-4xl bg-slate-900/95 border-cyan-700/50 text-slate-50 shadow-2xl backdrop-blur-md max-h-[85vh] min-h-[60vh] flex flex-row p-0">
        {/* Left Panel: Main Chat Area */}
        <div className="flex flex-col w-2/3 p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl flex items-center text-cyan-400">
              <Bot className="w-6 h-6 mr-2" /> 智能问答助手
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {analysisMode === "crawl"
                ? `基于 ${crawlReportGroups.length} 个网站的追踪爬取结果 (共 ${sourceCount} 个页面) 进行提问。`
                : `基于已爬取的 ${sourceCount} 个网页内容进行提问。`}
            </DialogDescription>
          </DialogHeader>

          {/* Conversation Area */}
          <div className="space-y-4 overflow-y-auto flex-grow pr-3 mr-[-6px] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50">
            {conversation.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed break-words shadow whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-700/80 text-slate-100"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={conversationEndRef} />
            {error && !loading && (
              <Alert
                variant="destructive"
                className="bg-red-900/40 border-red-700/60 text-red-300"
              >
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertTitle className="text-red-300">请求错误</AlertTitle>
                <AlertDescription className="text-red-400/90">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Input Area */}
          <div className="shrink-0 pt-4 mt-auto border-t border-slate-700/50">
            <div className="flex gap-2 items-center">
              <Input
                ref={inputRef}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder={
                  loading ? "AI正在思考..." : "对已载入的内容进行提问..."
                }
                className="flex-1 bg-slate-800/70 border-slate-700 focus-visible:ring-cyan-500 focus-visible:ring-1 placeholder:text-slate-500 text-slate-100"
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey && !loading) {
                    e.preventDefault()
                    handleAsk()
                  }
                }}
                disabled={loading || !combinedMarkdown}
              />
              <Button
                onClick={handleAsk}
                disabled={loading || !question.trim() || !combinedMarkdown}
                className="bg-cyan-600 hover:bg-cyan-500 text-slate-50 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "发送"}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel: Context and Sources */}
        <div className="w-1/3 bg-black/20 border-l border-cyan-800/30 p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-cyan-300 mb-4">情报源</h3>
          <div className="text-xs space-y-2 rounded-md bg-slate-800/70 border border-slate-700 p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50">
            {analysisMode === "crawl" ? (
              crawlReportGroups.map((group, groupIndex) => (
                <div key={`group-${groupIndex}`}>
                  <p className="font-bold text-cyan-400 truncate">
                    {group.startingUrl}
                  </p>
                  <ul className="pl-2 mt-1 space-y-1">
                    {group.reports.map((report, reportIndex) => (
                      <li
                        key={`report-${reportIndex}`}
                        className="text-slate-400 truncate hover:text-cyan-300 transition-colors"
                        title={report.url || ""}
                      >
                        - {report.title || report.url}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <ul>
                {reports.map((report, index) => (
                  <li
                    key={index}
                    className="text-slate-400 truncate hover:text-cyan-300 transition-colors"
                    title={report.url || ""}
                  >
                    - {report.title || report.url}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <DialogFooter className="mt-auto pt-4">
            <p className="text-xs text-slate-500 text-center w-full">
              AI生成的内容仅供参考。
            </p>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
} 