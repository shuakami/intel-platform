"use client"

import { create } from "zustand"

type AnalysisStatus = "idle" | "processing" | "active" | "error"

interface IntelState {
  analysisStatus: AnalysisStatus
  url: string | null
  title: string | null
  description: string | null
  language: string | null
  rawMarkdown: string | null
  htmlContent: string | null
  feedbackData: string | null
  collectionData: string | null
  reportData: string | null
  setAnalysisStatus: (status: AnalysisStatus) => void
  setReportData: (data: any) => void
  resetData: () => void
}

export const useIntelStore = create<IntelState>((set) => ({
  analysisStatus: "idle",
  url: null,
  title: null,
  description: null,
  language: null,
  rawMarkdown: null,
  htmlContent: null,
  feedbackData: null,
  collectionData: null,
  reportData: null,

  setAnalysisStatus: (status) => set({ analysisStatus: status }),

  setReportData: (data) =>
    set({
      url: data.url,
      title: data.title,
      description: data.description,
      language: data.language,
      rawMarkdown: data.rawMarkdown,
      htmlContent: data.htmlContent,
      feedbackData: data.feedbackData,
      collectionData: data.collectionData,
      reportData: data.reportData,
    }),

  resetData: () =>
    set({
      analysisStatus: "idle",
      url: null,
      title: null,
      description: null,
      language: null,
      rawMarkdown: null,
      htmlContent: null,
      feedbackData: null,
      collectionData: null,
      reportData: null,
    }),
}))
