// API functions for web scraping and intelligence analysis

import { marked } from "marked"

// Types for API responses
interface ScrapeResponse {
  success: boolean
  data: {
    markdown: string
    metadata: {
      title: string
      description?: string
      language?: string
      sourceURL: string
      url: string
    }
  }
}

interface BatchScrapeResponse {
  status: "completed" | "processing" | "failed"
  data: ScrapeResponse[]
}

interface CrawlResponse {
  status: "scraping" | "completed" | "failed" | "cancelled"
  data: ScrapeResponse[]
}

// Function to make actual API request
async function makeApiRequest(url: string): Promise<ScrapeResponse> {
  const baseApi = process.env.NEXT_PUBLIC_BASE_API;
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const timeout = Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 45000;

  if (!baseApi) {
    throw new Error("API endpoint not configured")
  }

  const apiUrl = `${baseApi}/v1/scrape`

  // Prepare headers with authentication if API key is provided
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  // Add Authorization header if API key is available
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      url: url,
      formats: ["markdown"],
      onlyMainContent: true,
      timeout: timeout,
    }),
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  const data = await response.json()

  // Transform the response to match our expected format
  return {
    success: data.success,
    data: {
      markdown: data.data.markdown,
      metadata: {
        title: data.data.metadata?.title || data.data.title || "Untitled",
        description: data.data.metadata?.description,
        language: data.data.metadata?.language,
        sourceURL: data.data.metadata?.sourceURL || data.data.metadata?.url || url,
        url: url,
      },
    },
  }
}

// Function to make actual API request for a batch of URLs
async function makeBatchApiRequest(urls: string[]): Promise<{ success: boolean, id: string }> {
  const baseApi = process.env.NEXT_PUBLIC_BASE_API
  const apiKey = process.env.NEXT_PUBLIC_API_KEY
  const timeout = Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 45000

  if (!baseApi) {
    throw new Error("API endpoint not configured")
  }

  const apiUrl = `${baseApi}/v1/batch/scrape`

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      urls: urls,
      formats: ["markdown"],
      onlyMainContent: true,
      timeout: timeout,
    }),
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return await response.json()
}

async function checkBatchScrapeStatus(jobId: string): Promise<BatchScrapeResponse> {
  const baseApi = process.env.NEXT_PUBLIC_BASE_API
  const apiKey = process.env.NEXT_PUBLIC_API_KEY

  if (!baseApi) {
    throw new Error("API endpoint not configured")
  }

  const apiUrl = `${baseApi}/v1/batch/scrape/${jobId}`

  const headers: Record<string, string> = {}

  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`
  }

  const response = await fetch(apiUrl, { headers })

  if (!response.ok) {
    throw new Error(`Failed to check batch status: ${response.status}`)
  }

  const result = await response.json()

  // The actual scraped data is nested, let's normalize it to match our ScrapeResponse type
  if (result.data && Array.isArray(result.data)) {
    result.data = result.data.map((item: any, index: number) => ({
      success: item.metadata.statusCode === 200,
    data: {
        markdown: item.markdown,
      metadata: {
          title: item.metadata?.title || "Untitled",
          description: item.metadata?.description,
          language: item.metadata?.language,
          sourceURL: item.metadata?.sourceURL || item.metadata?.url,
          url: item.metadata?.url,
        },
      },
    }));
  }


  return result
}

// Main function to analyze intelligence based on URL
export async function analyzeIntelligence(
  url: string | string[]
): Promise<any> {
  if (Array.isArray(url)) {
    return analyzeMultipleIntelligence(url)
  } else {
    return analyzeSingleIntelligence(url)
  }
}

async function analyzeSingleIntelligence(url: string): Promise<any> {
  // Validate URL format
  try {
    new URL(url)
  } catch {
    throw new Error("Invalid URL format")
  }

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  let scrapeResult: ScrapeResponse

  try {
      scrapeResult = await makeApiRequest(url)
  } catch (error) {
    console.error("API request failed:", error)
    throw error
  }

  // Process the scraped content
  const { markdown, metadata } = scrapeResult.data

  // Convert markdown to HTML for display
  const htmlContent = marked.parse(markdown)

  // Generate analysis based on the scraped content
  const analysis = generateAnalysis(markdown, metadata, url)

  return {
    url: url,
    title: metadata.title,
    description: metadata.description,
    language: metadata.language,
    rawMarkdown: markdown,
    htmlContent: htmlContent,
    feedbackData: marked.parse(analysis.feedback),
    collectionData: marked.parse(analysis.collection),
    reportData: marked.parse(analysis.report),
  }
}

async function analyzeMultipleIntelligence(urls: string[]): Promise<any[]> {
  // Validate URL formats
  urls.forEach(url => {
    try {
      new URL(url);
    } catch {
      throw new Error(`Invalid URL format: ${url}`);
    }
  });

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  let jobResult: { success: boolean, id: string };

  try {
    jobResult = await makeBatchApiRequest(urls);
    if (!jobResult.success) {
      throw new Error("Failed to submit batch scrape job.");
    }
  } catch (error) {
    console.error("API batch request failed:", error);
    throw error;
  }

  // Poll for the result
  const maxWaitTime = 120000; // 2 minutes
  const pollInterval = 5000; // 5 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    const statusResult = await checkBatchScrapeStatus(jobResult.id);

    if (statusResult.status === "completed") {
      // Process each scraped content
      return statusResult.data.map(result => {
        if (!result || !result.success) {
          return {
            url: result?.data?.metadata?.url || "Unknown URL",
            error: "Failed to scrape this URL.",
            rawMarkdown: "",
            htmlContent: "",
            feedbackData: "",
            collectionData: "",
            reportData: ""
          };
        }

        const { markdown, metadata } = result.data;
        const htmlContent = marked.parse(markdown);
        const analysis = generateAnalysis(markdown, metadata, metadata.url);

        return {
          url: metadata.url,
          title: metadata.title,
          description: metadata.description,
          language: metadata.language,
          rawMarkdown: markdown,
          htmlContent: htmlContent,
          feedbackData: marked.parse(analysis.feedback),
          collectionData: marked.parse(analysis.collection),
          reportData: marked.parse(analysis.report),
        };
      });
    } else if (statusResult.status === "failed") {
      throw new Error("Batch scrape job failed.");
    }
    // If status is "processing", continue polling
  }

  throw new Error("Batch scrape job timed out.");
}

// Function to generate analysis based on scraped content
function generateAnalysis(markdown: string, metadata: any, url: string) {
  const wordCount = markdown.split(/\s+/).length
  const hasImages = markdown.includes("![") || markdown.includes("<img")
  const hasLinks = markdown.includes("[") && markdown.includes("](")
  const domain = new URL(url).hostname

  const feedback = `
## 网页内容分析

- **页面标题**: ${metadata.title}
- **内容长度**: ${wordCount} 词
- **语言**: ${metadata.language || "未检测"}
- **域名**: ${domain}
- **包含图片**: ${hasImages ? "是" : "否"}
- **包含链接**: ${hasLinks ? "是" : "否"}

### 内容特征
${markdown.includes("##") ? "- 结构化内容，包含多个章节" : "- 简单文本内容"}
${markdown.includes("###") ? "- 详细的子章节划分" : ""}
${markdown.includes("*") || markdown.includes("**") ? "- 包含强调和格式化文本" : ""}

### 关键发现
网页内容已成功提取，包含${wordCount}个词汇的结构化信息。内容质量${wordCount > 500 ? "较高" : "中等"}，适合进一步分析处理。
  `

  const collection = `
## 数据收集报告

### 1. 技术信息
- **URL**: ${url}
- **响应状态**: 成功
- **内容类型**: ${markdown.includes("#") ? "Markdown格式" : "纯文本"}
- **提取时间**: ${new Date().toLocaleString("zh-CN")}

### 2. 内容统计
- **总字数**: ${wordCount}
- **段落数**: ${markdown.split("\n\n").length}
- **标题数**: ${(markdown.match(/^#+/gm) || []).length}
- **列表项**: ${(markdown.match(/^[-*+]/gm) || []).length}

### 3. 结构分析
${markdown.includes("# ") ? "- 包含主标题" : ""}
${markdown.includes("## ") ? "- 包含二级标题" : ""}
${markdown.includes("### ") ? "- 包含三级标题" : ""}
${hasLinks ? "- 包含外部链接" : ""}
${hasImages ? "- 包含图片资源" : ""}

### 4. 质量评估
- **内容完整性**: ${wordCount > 200 ? "高" : wordCount > 50 ? "中" : "低"}
- **结构清晰度**: ${markdown.includes("##") ? "高" : "中"}
- **信息密度**: ${wordCount / markdown.split("\n").length > 10 ? "高" : "中"}
  `

  const report = `
# 网页情报分析报告

## 摘要
本报告分析了目标网页 ${url} 的内容结构、信息质量和关键数据。

## 基本信息
- **目标URL**: ${url}
- **页面标题**: ${metadata.title}
- **内容语言**: ${metadata.language || "未检测"}
- **分析时间**: ${new Date().toLocaleString("zh-CN")}

## 内容分析

### 1. 结构特征
网页采用${markdown.includes("##") ? "层次化" : "简单"}结构，包含${wordCount}个词汇。
${markdown.includes("# ") ? "页面具有明确的主标题，" : ""}内容组织${markdown.includes("##") ? "清晰" : "简单"}。

### 2. 信息密度
- 平均每行字数: ${Math.round(wordCount / markdown.split("\n").length)}
- 内容丰富度: ${wordCount > 1000 ? "高" : wordCount > 300 ? "中" : "低"}
- 结构复杂度: ${(markdown.match(/^#+/gm) || []).length > 5 ? "高" : "中"}

### 3. 关键发现
${wordCount > 500 ? "网页内容丰富，包含大量有价值信息。" : "网页内容适中，包含基本信息。"}
${hasLinks ? "页面包含外部链接，可能涉及相关资源。" : ""}
${hasImages ? "页面包含图片内容，视觉信息丰富。" : ""}

## 风险评估
- **信息可靠性**: ${domain.includes("gov") || domain.includes("edu") ? "高" : domain.includes("news") || domain.includes("bbc") ? "中高" : "中"}
- **内容时效性**: 需要进一步验证
- **数据完整性**: ${wordCount > 200 ? "良好" : "一般"}

## 建议
1. ${wordCount > 500 ? "内容丰富，建议深入分析关键信息" : "内容较少，建议结合其他来源"}
2. ${hasLinks ? "关注页面中的外部链接，可能包含相关情报" : "页面链接较少，信息相对独立"}
3. 定期监控页面更新，跟踪信息变化

## 结论
目标网页已成功分析，提取了${wordCount}词的结构化内容。
${wordCount > 300 ? "内容质量较高，适合作为情报来源。" : "内容基本完整，可作为参考信息。"}
建议结合其他来源进行交叉验证，确保信息准确性。
  `

  return { feedback, collection, report }
}

// Function to sanitize scraped HTML content
export function sanitizeHtmlContent(htmlString: string | null): string {
  if (typeof window === "undefined" || !htmlString) {
    return ""
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlString, "text/html")

  // Remove potentially harmful or layout-breaking elements
  doc
    .querySelectorAll('script, style, link[rel="stylesheet"]')
    .forEach((el) => el.remove())

  // Return the sanitized HTML from the body tag
  return doc.body.innerHTML
}

// Function to process intelligence queries
export async function processIntelligenceQuery(query: string, reportData: string): Promise<string> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Mock processing logic based on query content
  if (query.includes("摘要") || query.includes("总结")) {
    return "根据爬取的网页内容，主要信息包括页面标题、结构化内容和关键数据。内容已经过处理和分析，提取了核心信息点。"
  }

  if (query.includes("链接") || query.includes("外链")) {
    return "页面中的链接分析：包含多个外部链接指向相关资源，内部链接用于页面导航。建议进一步分析链接目标的可靠性。"
  }

  if (query.includes("内容") || query.includes("文本")) {
    return "文本内容分析：页面包含结构化文本，使用标题层次组织信息。内容密度适中，信息组织清晰。"
  }

  if (query.includes("风险") || query.includes("安全")) {
    return "安全风险评估：页面来源需要验证，建议检查域名可信度。如包含用户输入或下载链接，需要额外安全检查。"
  }

  if (query.includes("更新") || query.includes("时间")) {
    return "内容时效性：建议定期重新爬取以获取最新信息。某些动态内容可能需要实时监控。"
  }

  // Default response
  return "根据爬取的网页分析，您可以询问关于页面内容、链接结构、安全风险或数据质量等方面的问题。我会基于已分析的数据为您提供详细解答。"
}
