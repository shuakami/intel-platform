"use client"

import { useEffect, useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertCircle, Bot } from "lucide-react"
import { useIntelStore } from "@/lib/store"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function IntelligenceQA() {
  const { rawMarkdown, analysisStatus } = useIntelStore()
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState("")
  const [conversation, setConversation] = useState<{ role: 'user' | 'assistant', content: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const conversationEndRef = useRef<HTMLDivElement>(null)

  // Effect to open/close dialog and reset states based on global store changes
  useEffect(() => {
    if (rawMarkdown && analysisStatus === "active") {
      setConversation([]) // Always clear conversation for a new session
      setQuestion("")      // Always clear question input for a new session
      setError("")         // Always clear previous errors for a new session
      setOpen(true)        // Then open the dialog
    } else if (analysisStatus !== "processing" && analysisStatus !== "active") {
      // Close if not processing and not meant to be active (e.g., idle, error, or data reset)
      setOpen(false)
    }
  }, [rawMarkdown, analysisStatus]) // Dependencies: trigger when these change

  const handleAsk = async () => {
    if (!question.trim()) return
    const currentQuestion = question.trim()
    setLoading(true)
    setError("")
    setConversation(prev => [...prev, { role: 'user', content: currentQuestion }])
    setQuestion("")

    try {
      const res = await fetch("/api/llm-handler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdownContent: rawMarkdown, userPrompt: currentQuestion })
      })
      const data = await res.json()
      if (data.response) {
        setConversation(prev => [...prev, { role: 'assistant', content: data.response }])
      } else {
        const errorMessage = data.error || "LLM未返回有效内容，请检查API配置或稍后再试。"
        setError(errorMessage)
        setConversation(prev => [...prev, { role: 'assistant', content: `错误: ${errorMessage}` }])
      }
    } catch (e: any) {
      const errorMessage = e.message || "与LLM通信失败，请检查网络或API服务。"
      setError(errorMessage)
      setConversation(prev => [...prev, { role: 'assistant', content: `错误: ${errorMessage}` }])
    } finally {
      setLoading(false)
    }
  }

  // Focus input when dialog opens or conversation updates (for quick follow-up)
  useEffect(() => {
    if (open && !loading && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open, loading, conversation])

  // Scroll to the end of conversation when new messages are added
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation])

  const handleDialogClose = (isOpen: boolean) => {
    // This function is called by Radix Dialog onOpenChange
    // We primarily manage `open` state via the useEffect hook listening to `rawMarkdown` and `analysisStatus`
    // However, if user manually closes (e.g. ESC key or overlay click), we should update our state.
    if (!isOpen) {
      setOpen(false) 
      // Optional: decide if other state like conversation should be cleared here or rely on next open trigger
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl bg-slate-900/95 border-cyan-700/50 text-slate-50 shadow-2xl backdrop-blur-md max-h-[85vh] flex flex-col">
        <DialogHeader className="mb-3 shrink-0">
          <DialogTitle className="text-xl flex items-center text-cyan-400">
            <Bot className="w-6 h-6 mr-2" /> 智能问答助手
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            基于当前爬取的网页内容进行提问。助手将根据提供的信息给出回答。
          </DialogDescription>
        </DialogHeader>

        {/* Main content area with scroll */} 
        <div className="space-y-4 overflow-y-auto flex-grow pr-3 mr-[-6px] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50">
          <div>
            <label htmlFor="markdown-display" className="block text-xs font-medium text-cyan-300 mb-1.5">已载入的网页Markdown内容 (只读)</label>
            <Textarea 
              id="markdown-display"
              value={rawMarkdown || "未加载任何内容。"} 
              readOnly 
              className="min-h-[100px] max-h-[180px] overflow-y-auto text-xs bg-slate-800/70 border-slate-700 p-2.5 rounded-md focus-visible:ring-cyan-500 focus-visible:ring-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50"
            />
          </div>

          {/* Conversation Area */} 
          <div className="space-y-3">
            {conversation.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed break-words shadow ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-700/80 text-slate-100'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={conversationEndRef} />
          </div>

          {error && !loading && (
            <Alert variant="destructive" className="bg-red-900/40 border-red-700/60 text-red-300">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertTitle className="text-red-300">请求错误</AlertTitle>
              <AlertDescription className="text-red-400/90">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Input Area */} 
        <div className="shrink-0 pt-3 mt-auto border-t border-slate-700/50">
          <div className="flex gap-2 items-center">
            <Input
              ref={inputRef}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder={loading ? "AI正在思考..." : "对以上Markdown内容提问..."}
              className="flex-1 bg-slate-800/70 border-slate-700 focus-visible:ring-cyan-500 focus-visible:ring-1 placeholder:text-slate-500 text-slate-100"
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !loading) { e.preventDefault(); handleAsk() } }}
              disabled={loading}
            />
            <Button onClick={handleAsk} disabled={loading || !question.trim()} className="bg-cyan-600 hover:bg-cyan-500 text-slate-50 disabled:opacity-70">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "发送"}
            </Button>
          </div>
        </div>

        <DialogFooter className="mt-3 shrink-0">
          <p className="text-xs text-slate-500 text-center w-full">
            AI生成的内容仅供参考。关闭对话框将清空当前问答记录。
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 