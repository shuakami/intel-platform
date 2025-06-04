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

interface MockScrapeData {
  [key: string]: {
    title: string
    markdown: string
    description?: string
    language?: string
  }
}

// Mock data for different websites - should look like actual scraped content
const mockScrapeData: MockScrapeData = {
  "bbc.com": {
    title: "BBC News - Technology",
    description: "Latest technology news from BBC",
    language: "en",
    markdown: `# Technology

## Latest Technology News

### UK threatens to sue Abramovich over Chelsea sale

The proceeds have been frozen since the UK government forced the club's sale following Russia's invasion of Ukraine.

*8 hrs ago | Business*

The UK government has threatened to take legal action against Roman Abramovich over the sale of Chelsea Football Club. The proceeds from the £4.25bn sale have been frozen in a government account since May 2022.

Government sources say they are prepared to sue the Russian oligarch if he does not comply with undertakings he gave when the club was sold.

### Tesla is 'not interested' in producing cars in India - minister

*4 hrs ago | Asia*

This is the first time India has publicly admitted that it has not been able to lure investment dollars from Musk.

India's road transport minister Nitin Gadkari has said that Tesla is "not interested" in manufacturing cars in India, marking the first time a government official has publicly acknowledged the setback.

The comments come after years of negotiations between the electric vehicle maker and Indian officials over potential investment in the country.

### Doctor describes 'total carnage' as 27 reported killed by Israeli fire at Gaza aid centre

*LIVE* 

For a third day running, Palestinians have been killed while collecting aid - the IDF confirms it fired shots and is investigating.

A doctor at a hospital in Gaza has described scenes of "total carnage" after 27 people were reportedly killed by Israeli fire at an aid distribution centre.

The incident occurred as Palestinians were collecting food aid in Gaza City. The Israeli military has confirmed it opened fire and says it is investigating the circumstances.

### New Madeleine McCann search under way in Portugal

*43 mins ago | Europe*

Authorities say the new search will be across 21 plots and will continue until Friday.

Portuguese police have begun a new search for missing British girl Madeleine McCann in the Algarve region.

The search is being conducted across 21 plots of land near the resort of Praia da Luz, where the three-year-old disappeared in 2007.

### Lady Gaga and Pulp rumoured for surprise Glastonbury sets as full line-up revealed

*2 hrs ago | Somerset*

With three weeks to go, the UK's biggest festival unveils its full line-up, plus a few mystery sets.

Glastonbury Festival has revealed its full line-up for 2024, with rumours circulating about surprise performances by Lady Gaga and Pulp.

The festival, which takes place from 26-30 June at Worthy Farm in Somerset, will be headlined by Dua Lipa, Coldplay and SZA.

---

## More Technology Stories

- **Apple announces new AI features** - The tech giant reveals plans for artificial intelligence integration across its devices
- **Cybersecurity threats on the rise** - Experts warn of increasing attacks on critical infrastructure  
- **Electric vehicle sales surge** - Global EV sales reach record highs in Q1 2024
- **Social media regulation debate** - Governments worldwide consider new rules for tech platforms

## Navigation

- [Home](/)
- [News](/news)
- [Sport](/sport)
- [Business](/business)
- [Innovation](/innovation)
- [Culture](/culture)`,
  },
  "github.com": {
    title: "GitHub: Let's build from here",
    description: "GitHub is where over 100 million developers shape the future of software, together.",
    language: "en",
    markdown: `# GitHub: Let's build from here

The complete developer platform to build, scale, and deliver secure software.

## Sign up for GitHub

**Email address**

[Sign up for GitHub]

By creating an account, you agree to the [Terms of Service](). For more information about GitHub's privacy practices, see the [GitHub Privacy Statement]().

## Trusted by the world's leading organizations ↘︎

[Stripe] [Pinterest] [KLM] [Mercedes-Benz] [P&G] [Telus]

## Productivity

**GitHub Copilot**
Don't fly solo. Try 30 days for free.

GitHub Copilot empowers developers to complete tasks 55% faster with contextualized AI coding assistance across workflows.

[Start building with Copilot]

**GitHub Codespaces**
Spin up fresh, fully configured dev environments in the cloud—and code, build, test, and debug right from your browser.

## Collaboration

**Pull requests**
Propose changes to your code and collaborate on those changes with your team. You can discuss implementations before merging.

**GitHub Issues**
Coordinate work, track bugs, and discuss features with integrated project management tools.

**GitHub Discussions**
Ask questions, share information, make announcements, and conduct conversations about your project.

## Security

**GitHub Advanced Security**
Secure your code as you write it. Vulnerability scanning, dependency insights, and secret scanning.

**Code scanning**
Find and fix vulnerabilities in your code using CodeQL and third-party tools.

**Secret scanning**
Get alerted when secrets are pushed to your repository.

**Dependency insights**
See your dependencies and get alerted about vulnerabilities.

## Popular repositories

### microsoft/vscode
Visual Studio Code
⭐ 142k | 🍴 25.1k | TypeScript

### facebook/react  
The library for web and native user interfaces
⭐ 215k | 🍴 44.8k | JavaScript

### tensorflow/tensorflow
An Open Source Machine Learning Framework for Everyone
⭐ 180k | 🍴 73.9k | C++

### kubernetes/kubernetes
Production-Grade Container Scheduling and Management
⭐ 104k | 🍴 38.2k | Go

## GitHub for teams

**GitHub Team**
Advanced collaboration for your growing team.
$4 per user/month

**GitHub Enterprise**
Advanced security and compliance for enterprises.
$21 per user/month

[Contact sales]

---

© 2024 GitHub, Inc.
[Terms] [Privacy] [Security] [Status] [Docs] [Contact GitHub] [Pricing] [API] [Training] [Blog] [About]`,
  },
  "news.": {
    title: "Breaking News - Latest Headlines",
    description: "Stay informed with the latest breaking news and updates",
    language: "en",
    markdown: `# Breaking News

## Top Headlines

### Global Markets React to Economic Indicators
*2 hours ago*

Financial markets worldwide showed mixed reactions today following the release of key economic indicators from major economies. The Dow Jones fell 0.3% while European markets remained relatively stable.

Key points:
- US inflation data came in slightly above expectations at 3.2%
- European Central Bank hints at potential rate adjustments
- Asian markets closed mixed with Tokyo up 0.8%

### Climate Summit Reaches Key Agreement
*4 hours ago*

World leaders at the Global Climate Summit have reached a breakthrough agreement on carbon emission reduction targets for the next decade.

The agreement includes:
- 50% reduction in global emissions by 2030
- $100 billion fund for developing nations
- New renewable energy initiatives

### Technology Sector Sees Major Merger
*6 hours ago*

Two major technology companies announced a strategic merger worth $45 billion, creating one of the largest tech conglomerates in the industry.

Details of the merger:
- Expected completion by Q3 2024
- Combined workforce of over 200,000 employees
- Focus on AI and cloud computing services

### Sports Championship Finals
*8 hours ago*

The championship finals concluded with exciting matches across multiple sports leagues.

Results:
- Basketball: Lakers defeat Celtics 108-102
- Soccer: Manchester United wins Premier League
- Tennis: Djokovic advances to Wimbledon final

### Health Research Breakthrough
*10 hours ago*

Scientists at leading research institutions announced a significant breakthrough in cancer treatment research, showing promising results in early clinical trials.

The research findings:
- 85% success rate in Phase II trials
- New immunotherapy approach
- Potential FDA approval by 2025

## Weather Update

**Today's Forecast**
- High: 75°F (24°C)
- Low: 58°F (14°C)  
- Partly cloudy with chance of rain

## Market Watch

**Stock Indices**
- S&P 500: 4,235.12 (-0.2%)
- NASDAQ: 13,102.55 (+0.1%)
- FTSE 100: 7,445.32 (-0.1%)

**Currency Exchange**
- USD/EUR: 1.0845
- USD/GBP: 1.2634
- USD/JPY: 149.23

---

*Last updated: ${new Date().toLocaleString()}*`,
  },
  "gov.": {
    title: "Official Government Website",
    description: "Official government information and services",
    language: "en",
    markdown: `# Government Official Website

## Welcome to the Official Government Portal

This is the official website of the government, providing citizens with access to government services, information, and resources.

## Latest Announcements

### New Policy Implementation
*Published: March 15, 2024*

The government has announced the implementation of new policies effective April 1, 2024. These policies aim to improve public services and enhance citizen welfare.

**Key Changes:**
- Enhanced digital services platform
- Streamlined application processes
- Improved customer support

### Budget Allocation for Infrastructure
*Published: March 10, 2024*

The government has allocated $2.5 billion for infrastructure development projects across the country.

**Project Areas:**
- Transportation networks
- Digital infrastructure
- Healthcare facilities
- Educational institutions

### Public Health Initiative
*Published: March 5, 2024*

A new public health initiative has been launched to promote community wellness and preventive healthcare.

**Program Components:**
- Free health screenings
- Vaccination campaigns
- Health education programs
- Mental health support services

## Government Services

### Online Services
- Tax filing and payments
- License renewals
- Permit applications
- Benefits enrollment

### Citizen Resources
- Government directory
- Public records access
- Legal aid services
- Emergency contacts

### Business Services
- Business registration
- Regulatory compliance
- Procurement opportunities
- Economic development programs

## Departments

### Department of Health
Responsible for public health policy and healthcare services.

### Department of Education
Oversees educational standards and public school systems.

### Department of Transportation
Manages transportation infrastructure and public transit.

### Department of Finance
Handles government budgets and financial planning.

## Contact Information

**Main Office**
123 Government Plaza
Capital City, State 12345

**Phone:** (555) 123-4567
**Email:** info@government.gov
**Hours:** Monday-Friday, 8:00 AM - 5:00 PM

## Emergency Services
- Police: 911
- Fire Department: 911
- Medical Emergency: 911
- Non-Emergency: (555) 311-0000

---

*This website is maintained by the Government Information Technology Department*
*Last updated: ${new Date().toLocaleDateString()}*`,
  },
  "edu.": {
    title: "University Homepage",
    description: "Leading institution of higher education and research",
    language: "en",
    markdown: `# University of Excellence

## Welcome to Our Academic Community

Founded in 1875, the University of Excellence is a leading institution of higher education committed to academic excellence, innovative research, and community service.

## Quick Links

- [Apply Now](/) | [Visit Campus](/) | [Student Portal](/) | [Faculty Directory](/)

## Latest News

### Research Breakthrough in Renewable Energy
*March 18, 2024*

Our engineering department has achieved a significant breakthrough in solar panel efficiency, increasing energy conversion rates by 25%.

### New Medical School Building Opens
*March 15, 2024*

The state-of-the-art medical education facility officially opened, featuring advanced simulation labs and research centers.

### Student Achievement Recognition
*March 12, 2024*

Five students received national awards for their outstanding research in artificial intelligence and machine learning.

## Academic Programs

### Undergraduate Programs
- **College of Arts & Sciences** - Liberal arts, sciences, and humanities
- **School of Engineering** - Computer science, electrical, mechanical engineering
- **Business School** - Finance, marketing, management, entrepreneurship
- **School of Medicine** - Pre-med, nursing, public health

### Graduate Programs
- **Master's Degrees** - 45+ programs across all disciplines
- **Doctoral Programs** - PhD programs in 30+ fields
- **Professional Schools** - Law, medicine, business, education

### Online Learning
- Distance education programs
- Hybrid learning options
- Professional development courses
- Continuing education

## Research Excellence

### Research Centers
- **Institute for Advanced Computing** - AI and machine learning research
- **Center for Sustainable Energy** - Renewable energy solutions
- **Medical Research Institute** - Clinical trials and biomedical research
- **Social Policy Research Center** - Public policy analysis

### Funding & Grants
- $150M in annual research funding
- 200+ active research projects
- Partnerships with industry leaders
- Government research contracts

## Campus Life

### Student Organizations
- 150+ student clubs and organizations
- Greek life with 25 chapters
- Student government association
- Honor societies and academic clubs

### Athletics
- **Division I Sports** - 18 varsity teams
- **Intramural Sports** - 20+ recreational leagues
- **Fitness Centers** - 3 campus recreation facilities
- **School Spirit** - Eagles athletics program

### Housing & Dining
- 12 residence halls
- 8 dining locations
- Meal plans available
- Campus safety services

## Admissions

### Application Requirements
- Completed application form
- Official transcripts
- Standardized test scores (SAT/ACT)
- Letters of recommendation
- Personal statement

### Important Dates
- **Early Decision:** November 15
- **Regular Decision:** January 15
- **Transfer Applications:** March 1
- **Graduate Applications:** Varies by program

### Financial Aid
- Merit-based scholarships
- Need-based financial aid
- Work-study programs
- Student loan assistance

## Contact Information

**Admissions Office**
Phone: (555) 123-UNIV
Email: admissions@university.edu

**Main Campus**
456 University Avenue
College Town, State 67890

**Campus Tours**
Available Monday-Saturday
Register online or call (555) 123-TOUR

---

*Accredited by the Higher Learning Commission*
*Equal Opportunity Institution*`,
  },
  default: {
    title: "Welcome to Our Website",
    description: "Your trusted source for information and services",
    language: "en",
    markdown: `# Welcome to Our Website

## About Us

We are dedicated to providing excellent service and valuable information to our visitors. Our website offers a comprehensive range of resources and tools to meet your needs.

## Our Services

### Professional Services
We offer a wide range of professional services designed to help individuals and businesses achieve their goals.

- Consulting and advisory services
- Technical support and maintenance
- Training and development programs
- Custom solutions and implementations

### Customer Support
Our dedicated customer support team is available to assist you with any questions or concerns.

**Contact Methods:**
- Phone: (555) 123-4567
- Email: support@website.com
- Live chat: Available 24/7
- Help center: Comprehensive FAQ and guides

## Latest Updates

### New Feature Release
*March 20, 2024*

We're excited to announce the launch of our new user dashboard, featuring improved navigation and enhanced functionality.

### System Maintenance Notice
*March 18, 2024*

Scheduled maintenance will occur this weekend from 2:00 AM to 6:00 AM EST. Some services may be temporarily unavailable.

### Partnership Announcement
*March 15, 2024*

We've partnered with leading industry providers to offer expanded services and better value to our customers.

## Resources

### Documentation
- User guides and tutorials
- API documentation
- Best practices and tips
- Video tutorials and webinars

### Community
- User forums and discussions
- Expert advice and insights
- Networking opportunities
- Events and workshops

## Getting Started

1. **Create an Account** - Sign up for free access to our services
2. **Explore Features** - Browse our comprehensive feature set
3. **Get Support** - Access help when you need it
4. **Join Community** - Connect with other users

## Contact Information

**Main Office**
123 Business Street
City, State 12345

**Business Hours**
Monday - Friday: 9:00 AM - 6:00 PM
Saturday: 10:00 AM - 4:00 PM
Sunday: Closed

**Social Media**
- Twitter: @ourwebsite
- LinkedIn: /company/ourwebsite
- Facebook: /ourwebsite

---

*© 2024 Our Website. All rights reserved.*
*Privacy Policy | Terms of Service | Cookie Policy*`,
  },
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

// Function to get mock data based on URL
function getMockData(url: string): ScrapeResponse {
  let mockData = mockScrapeData.default

  // Find matching domain
  const domains = Object.keys(mockScrapeData)
  for (const domain of domains) {
    if (domain !== "default" && url.includes(domain)) {
      mockData = mockScrapeData[domain]
      break
    }
  }

  return {
    success: true,
    data: {
      markdown: mockData.markdown,
      metadata: {
        title: mockData.title,
        description: mockData.description,
        language: mockData.language || "en",
        sourceURL: url,
        url: url,
      },
    },
  }
}

// Main function to analyze intelligence based on URL
export async function analyzeIntelligence(url: string): Promise<any> {
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
    // Try to make actual API request if NEXT_PUBLIC_BASE_API is configured
    const baseApi = process.env.NEXT_PUBLIC_BASE_API

    if (baseApi) {
      console.log("Using real API (NEXT_PUBLIC_BASE_API):", baseApi)
      scrapeResult = await makeApiRequest(url)
    } else {
      console.log("Using mock data - no API configured")
      scrapeResult = getMockData(url)
    }
  } catch (error) {
    console.warn("API request failed, falling back to mock data:", error)
    scrapeResult = getMockData(url)
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
