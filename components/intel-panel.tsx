"use client"

import type React from "react"

import { useState } from "react"
import { SquarePlus, Globe, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import StatusIndicator from "./status-indicator"
import { analyzeIntelligence } from "@/lib/api"
import { useIntelStore } from "@/lib/store"

export default function IntelPanel() {
  const [url, setUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { setAnalysisStatus, setReportData } = useIntelStore()

  // Get API key from environment if available
  const envApiKey = process.env.NEXT_PUBLIC_API_KEY || ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      alert("请输入有效的URL地址")
      return
    }

    // Set API key in localStorage if provided
    if (apiKey.trim()) {
      localStorage.setItem("api_key", apiKey.trim())
    }

    setIsLoading(true)
    setAnalysisStatus("processing")

    try {
      const data = await analyzeIntelligence(url)
      setReportData(data)
      setAnalysisStatus("active")
    } catch (error) {
      console.error("Analysis failed:", error)
      setAnalysisStatus("error")
      alert("分析失败，请检查URL或稍后重试")
    } finally {
      setIsLoading(false)
    }

    setUrl("")
  }

  return (
    <div className="intel-panel rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <StatusIndicator status="active" />
        <h2 className="intel-title text-xl">智瞻情报分析平台</h2>
        <div className="flex-1"></div>
        <span className="text-xs text-cyan-400 font-mono uppercase tracking-wider">Status: Online</span>
      </div>

      <section className="print:hidden">
        <div className="flex justify-between items-center border-b border-cyan-800/30 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <StatusIndicator status={isLoading ? "processing" : "active"} />
            <h3 className="text-lg font-semibold text-cyan-300 font-mono uppercase tracking-wider">网页爬取分析</h3>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="intel-button h-8 w-8"
              onClick={() => setShowApiKey(!showApiKey)}
              title="API密钥设置"
            >
              <Key className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="intel-button h-8 w-8">
              <SquarePlus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {showApiKey && (
            <div className="space-y-2">
              <label
                className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 mb-3 text-sm font-semibold text-cyan-300 font-mono uppercase tracking-wide"
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
              <div className="text-xs text-cyan-400/70 mt-1">
                {envApiKey ? "已配置环境变量API密钥，此处输入将覆盖环境变量" : "未配置环境变量API密钥，请在此处输入"}
              </div>
            </div>
          )}

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
              rows={3}
              placeholder="请输入要分析的网址，如：https://www.bbc.com/news/technology"
              name="url"
              id="target-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
            <div className="text-xs text-cyan-400/70 mt-1">支持分析新闻网站、技术博客、官方网站等各类网页内容</div>
          </div>
          <Button
            className="w-full mt-6 intel-button py-3 rounded-lg font-mono uppercase tracking-wider text-sm font-semibold"
            type="submit"
            disabled={isLoading}
          >
            <span className="flex items-center gap-2">
              <span>{isLoading ? "⏳" : "▶"}</span>
              <span>{isLoading ? "正在爬取分析..." : "开始爬取分析"}</span>
            </span>
          </Button>
        </form>
      </section>
    </div>
  )
}
