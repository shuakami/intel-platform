"use client"

import DataStream from "@/components/data-stream"
import Header from "@/components/header"
import IntelPanel from "@/components/intel-panel"
import DataCards from "@/components/data-cards"
import ReportPanel from "@/components/report-panel"
import IntelligenceQA from "@/components/IntelligenceQA"
import { useIntelStore } from "@/lib/store"

export default function Home() {
  const { analysisMode } = useIntelStore()

  return (
    <div className="max-lg:max-w-screen-md max-w-screen-lg mx-auto px-4 relative">
      <DataStream />
      <Header />
      <main className="relative z-10 space-y-8 pb-12">
        <IntelPanel />
        {analysisMode === "report" ? (
          <>
            <ReportPanel />
            <div className="border-b border-dashed border-cyan-800/30 my-8"></div>
            <DataCards />
          </>
        ) : (
          <>
        <DataCards />
        <ReportPanel />
          </>
        )}
      </main>
      <IntelligenceQA />
    </div>
  )
}
