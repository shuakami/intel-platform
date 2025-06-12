import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

export const runtime = "edge"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const planPrompt = `
You are an expert research assistant. Your goal is to understand a user's request and create a concrete, actionable plan to find the necessary information online.

The user wants to analyze a topic. Based on their request, you must decide the best strategy:
1.  **crawl**: If the request is about a specific entity, company, or project that has a primary website, a deep crawl of that single site is best.
2.  **scrape**: If the request is broader and requires information from multiple sources (e.g., news, reviews, different organizations), a batch scrape of several specific URLs is best.

You must search for the most relevant URLs online to fulfill the user's request.

**User Request:**
"{user_query}"

**Your Task:**
Respond with a JSON object containing two properties:
1.  \`mode\`: A string, either "crawl" or "scrape".
2.  \`urls\`: An array of strings, containing the 1 to 5 most relevant URLs you've found.

**Example Responses:**

*   **User Request:** "I need a report on Apple's latest Vision Pro product."
    *   **Your JSON Response:**
        \`\`\`json
        {
          "mode": "crawl",
          "urls": ["https://www.apple.com/apple-vision-pro/"]
        }
        \`\`\`
*   **User Request:** "What's the latest news about the new NVIDIA GB200 chip?"
    *   **Your JSON Response:**
        \`\`\`json
        {
          "mode": "scrape",
          "urls": [
            "https://nvidianews.nvidia.com/news/nvidia-gb200-grace-blackwell-superchip-for-trillion-parameter-era-of-ai",
            "https://www.tomshardware.com/pc-components/gpus/nvidias-next-gen-gb200-detailed-900w-per-gpu-and-288-cores-per-node",
            "https://www.anandtech.com/show/21303/nvidia-unveils-gb200-grace-blackwell-superchip-and-system"
          ]
        }
        \`\`\`

**IMPORTANT:**
- Do not write any text or explanation outside of the JSON object.
- Ensure the JSON is perfectly formatted.
- The URLs must be real and accessible.
`

export async function POST(req: NextRequest) {
  const { query } = await req.json()

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 })
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: planPrompt.replace("{user_query}", query),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    })

    const plan = JSON.parse(response.choices[0].message.content || "{}")

    if (!plan.mode || !plan.urls || plan.urls.length === 0) {
      throw new Error("AI planner returned an invalid plan.")
    }

    return NextResponse.json(plan)
  } catch (error) {
    console.error("Error calling OpenAI:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json(
      { error: "Failed to get a plan from AI.", details: errorMessage },
      { status: 500 }
    )
  }
} 