import DataStream from "@/components/data-stream"
import Header from "@/components/header"
import IntelPanel from "@/components/intel-panel"
import DataCards from "@/components/data-cards"
import ReportPanel from "@/components/report-panel"
import IntelligenceQA from "@/components/IntelligenceQA"
import { Suspense } from "react"

export default function Home() {
  return (
    <div className="max-lg:max-w-screen-md max-w-screen-lg mx-auto px-4 relative">
      <DataStream />
      <Header />
      <main className="relative z-10 space-y-6">
        <IntelPanel />
        <DataCards />
        <ReportPanel />
      </main>
      <IntelligenceQA />
    </div>
  )
}
