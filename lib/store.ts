"use client"

import { create } from "zustand"

type AnalysisStatus = "idle" | "processing" | "active" | "error"

export interface Report {
  url: string | null
  title: string | null
  description: string | null
  language: string | null
  rawMarkdown: string | null
  htmlContent: string | null
  feedbackData: string | null
  collectionData: string | null
  reportData: string | null
  error?: string
}

export interface CrawlResultGroup {
  startingUrl: string
  reports: Report[]
}

interface IntelState {
  analysisStatus: AnalysisStatus
  analysisMode: "scrape" | "crawl" | "report"
  reports: Report[]
  crawlReportGroups: CrawlResultGroup[]
  finalReport: string | null
  autoQuery: string | null
  isQaPanelOpen: boolean
  setAnalysisStatus: (status: AnalysisStatus) => void
  setReportData: (
    data: any,
    mode: "scrape" | "crawl" | "report",
    options?: { query?: string }
  ) => void
  setFinalReport: (
    finalReport: string,
    intermediateData: Report[] | CrawlResultGroup[],
    intermediateDataType: "scrape" | "crawl",
    query: string
  ) => void
  setQaPanelOpen: (isOpen: boolean) => void
  resetData: () => void
  removeReport: (url: string) => void
}

export const useIntelStore = create<IntelState>((set) => ({
  analysisStatus: "idle",
  analysisMode: "scrape",
  reports: [],
  crawlReportGroups: [],
  finalReport: null,
  autoQuery: null,
  isQaPanelOpen: false,

  setAnalysisStatus: (status) => set({ analysisStatus: status }),

  setReportData: (data, mode, options) => {
    if (mode === "crawl") {
      set({
        crawlReportGroups: data as CrawlResultGroup[],
        reports: [],
        analysisMode: "crawl",
        analysisStatus: "active",
        finalReport: null,
        autoQuery: options?.query || null,
      })
    } else if (mode === "report") {
      set({
        finalReport: data as string,
        analysisMode: "report",
        analysisStatus: "active",
      })
    } else {
      const reports = Array.isArray(data) ? data : [data]
      set({
        reports: reports,
        crawlReportGroups: [],
        analysisMode: "scrape",
        analysisStatus: "active",
        finalReport: null,
        autoQuery: options?.query || null,
      })
    }
  },

  removeReport: (url) => {
    set((state) => ({
      reports: state.reports.filter((report) => report.url !== url),
    }))
  },

  setFinalReport: (
    finalReport,
    intermediateData,
    intermediateDataType,
    query
  ) => {
    if (intermediateDataType === "crawl") {
      set({
        finalReport,
        crawlReportGroups: intermediateData as CrawlResultGroup[],
        reports: [],
        analysisMode: "report",
        analysisStatus: "active",
        autoQuery: query,
      })
    } else {
      // scrape
      set({
        finalReport,
        reports: intermediateData as Report[],
        crawlReportGroups: [],
        analysisMode: "report",
        analysisStatus: "active",
        autoQuery: query,
      })
    }
  },

  setQaPanelOpen: (isOpen) => set({ isQaPanelOpen: isOpen }),

  resetData: () => {
    console.log("[STORE] resetData called. Resetting state to initial values.")
    set({
      analysisStatus: "idle",
      analysisMode: "scrape",
      reports: [],
      crawlReportGroups: [],
      finalReport: null,
      autoQuery: null,
      isQaPanelOpen: false,
    })
  },
}))
