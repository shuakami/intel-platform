import { NextRequest, NextResponse } from 'next/server';

const planPrompt = `你是一位专业的AI研究与计划师。你的任务是为信息抓取创建一个具体、可行的计划。

**用户请求:**
"{user_query}"

**核心任务:**
根据用户请求，决定最佳的信息获取策略（"crawl" 或 "scrape"），并提供一组最相关、最优质的公开URL。

**思考与分析过程 (非常重要):**
1.  **理解与分解请求:** 首先，利用你的内部知识库，深入理解用户的真实意图。将模糊的请求分解成具体、可查询的实体、人名、事件或问题。
2.  **形成查询策略:** 基于你的理解，制定一个高效的查询策略。**不要**直接使用用户的原始、笼统的问句进行搜索。
3.  **示例:**
    *   **如果用户问:** "现任驻华美国总领事的姓名是什么？"
    *   **你的思考过程应该是:** "用户的目标是找到现任美国驻华大使。根据我的知识，这个人是尼古拉斯·伯恩斯 (Nicholas Burns)。因此，我应该直接去查找关于'尼古拉斯·伯恩斯'的权威信息（例如维基百科），或者查找'美国驻华大使馆官方网站'来验证，而不是去搜索'现任驻华美国总领事的姓名是什么'这个句子。"
    *   **最终形成的搜索查询应该是:** "尼古拉斯·伯恩斯" 和 "美国驻华大使馆现任列表"。

**策略选择:**
1.  **crawl (深度爬取):** 当请求针对一个有官方网站的特定实体（如公司、项目、组织）时使用。这通常意味着只提供该实体的根URL。
2.  **scrape (多源抓取):** 当请求需要综合来自多个视角或来源的信息（如新闻、评论、百科、论坛）时使用。这需要提供多个不同的URL。

**URL选择标准 (非常重要):**
1.  **公开可访问:** 优先选择无需登录、订阅或付费即可访问的公开页面。**绝对避免**需要登录才能查看主要内容的社交媒体页面、论坛或私有网站。
2.  **权威与中立:** 优先选择来自权威和中立来源的URL。例如：
    *   **百科类:** 维基百科（Wikipedia）、百度百科等。
    *   **官方网站:** 相关公司、组织或项目的官方主页。
    *   **信誉良好的新闻媒体:** 大型、知名的国际或国内新闻机构。
3.  **使用搜索引擎:** 如果不确定最佳的直接URL，可以构建多个搜索引擎的查询URL来查找信息。例如：\`https://cn.bing.com/search?q=%E6%90%9C%E7%B4%A2%E8%AF%8D&qs=n&form=QBRE&sp=-1&lq=0&pq=sou%27s%27ci&sc=13-8&sk=&cvid=165E7DFEEF4F4A43A6C4622DF9471AB3\`。
4.  **相关性:** 确保提供的URL是基于你 **思考与分析后** 确定的具体实体或问题，而不是用户的原始宽泛请求。

**你的输出:**
以一个JSON对象作为回应，该对象包含两个属性：
1.  \`mode\`: 一个字符串，值为 "crawl" 或 "scrape"。
2.  \`urls\`: 一个字符串数组，包含你找到的1到5个最相关、高质量的URL。

**格式要求:**
- 严格遵守JSON格式，不要在JSON对象之外添加任何文本、注释或解释。
- URL必须是完整、有效且可访问的。`

const qaPromptTemplate = `请根据以下Markdown内容，用中文回答用户的请求。

**Current Date (UTC):**
{current_date}

<markdown>
{markdownContent}
</markdown>

用户请求: {userPrompt}`

const synthesizePromptTemplate = `你是一位专业的情报分析师。你收到了从多个网页上抓取的大量原始、非结构化文本，以及用户的原始请求。
你的任务是将所有这些信息综合成一份高质量、专业、结构清晰的Markdown报告，该报告需直接回应用户的请求。
请务必使用中文撰写报告。

**Current Date (UTC):**
{current_date}

**用户的原始请求:**
"{user_query}"

**来自网页的原始内容:**
你将收到一系列带有明确来源标识的文本块。每个块的格式如下：
\`\`\`
[BEGIN SOURCE N]
URL: {source_url}

{source_content}
[END SOURCE N]
\`\`\`
其中 "N" 是来源的唯一编号。

<markdown>
{markdownContent}
</markdown>

**你的报告要求:**
1.  **结构:** 报告必须是Markdown格式。使用标题（#, ##, ###）、列表（* 或 -）、粗体（**）和表格（在适当时）来创建清晰、可读的结构。
2.  **内容:**
    *   以一个简洁的"执行摘要"（## 执行摘要）开始，给出最重要的发现。
    *   直接回应用户请求的所有部分。
    *   综合来自不同来源的信息，而不是简单地罗列每个页面的内容。
    *   提取关键数据点、事实、数字和引述。
    *   如果信息来源存在冲突，请指出这一点。
3.  **引用与归属 (非常重要):**
    *   当你在报告中陈述一个事实、数据或引用时，**必须** 在句子或段落的末尾使用方括号注明其来源编号。例如：\`这是一个重要的发现 [Source 1]。\`
    *   如果一个信息点由多个来源证实，可以同时引用它们。例如：\`该产品的价格为99美元 [Source 1][Source 3]。\`
    *   **不要** 在报告中直接复制粘贴原始URL。仅使用 \`[Source N]\` 格式进行引用。
    *   有时候每行引用的 \`[Source N]\` 一个就够了。这样会更加简洁。
    *   **不要在报告末尾添加参考资料章节。**
4.  **语气:** 专业、客观、分析性。
5.  **输出:** 你的最终输出应该只有Markdown报告本身。报告前后不要包含任何其他文字、歉意或解释。不要输出任何其他内容，包括markdown的代码标记。`

async function callLLM(
  task: "plan" | "qa" | "synthesize",
  payload: {
    userPrompt?: string
    markdownContent?: string
  }
) {
  const currentDate = new Date().toUTCString()

  const MAX_CONTEXT_TOKENS = 40000
  const PROMPT_BUFFER_TOKENS = 4096 
  const MAX_PAYLOAD_TOKENS = MAX_CONTEXT_TOKENS - PROMPT_BUFFER_TOKENS


  const CHARS_PER_TOKEN_ESTIMATE = 2
  const MAX_CHARS = MAX_PAYLOAD_TOKENS * CHARS_PER_TOKEN_ESTIMATE

  let processedMarkdown = payload.markdownContent || ""

  if (
    (task === "qa" || task === "synthesize") &&
    processedMarkdown.length > MAX_CHARS
  ) {
    console.warn(
      `[LLM Handler] Markdown content length (${processedMarkdown.length} chars) exceeds the safe limit. Truncating to ${MAX_CHARS} characters.`
    )
    processedMarkdown = processedMarkdown.substring(0, MAX_CHARS)
  }
  // --- End Token Management ---

  const apiKey = process.env.LLM_API_KEY;
  const apiUrl = process.env.LLM_API;
  const model = process.env.LLM_API_MODEL;

  if (!apiUrl || !model) {
    console.error('LLM environment variables not set:', { apiUrl: !!apiUrl, model: !!model });
    throw new Error('LLM API URL, or Model is not configured in environment variables.');
  }

  if (!apiKey) {
    console.warn('[LLM Handler] LLM_API_KEY is not set. Proceeding without authentication. This is expected for local models like Ollama.');
  }

  let messages: { role: "system" | "user"; content: string }[] = [];
  let responseFormat: { type: "json_object" } | undefined = undefined;

  switch (task) {
    case "plan":
      messages = [
        {
          role: "system",
          content: planPrompt
            .replace("{user_query}", payload.userPrompt || "")
            .replace("{current_date}", currentDate),
        },
      ];
      responseFormat = { type: "json_object" };
      break;
    case "synthesize":
      messages = [
        {
          role: "system",
          content: "You are a professional intelligence analyst.",
        },
        {
          role: "user",
          content: synthesizePromptTemplate
            .replace("{user_query}", payload.userPrompt || "")
            .replace("{markdownContent}", processedMarkdown || "")
            .replace("{current_date}", currentDate),
        },
      ];
      break;
    case "qa":
    default:
      messages = [
        {
          role: "system",
          content: "You are an assistant that processes provided Markdown text based on a user's specific prompt.",
        },
        {
          role: "user",
          content: qaPromptTemplate
            .replace("{markdownContent}", processedMarkdown || "")
            .replace("{userPrompt}", payload.userPrompt || "")
            .replace("{current_date}", currentDate),
        },
      ];
      break;
  }

  const requestBody = {
    model: model,
    messages: messages,
    stream: false,
    ...(responseFormat && { response_format: responseFormat }),
  };

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        throw new Error(`LLM API request failed with status ${response.status}: ${response.statusText}`);
      }
      throw new Error(`LLM API request failed with status ${response.status}: ${errorData?.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // For plan task, we expect the raw JSON string
    if (task === "plan") {
      return data.choices?.[0]?.message?.content || "{}";
    }

    return data.choices?.[0]?.message?.content || "No content returned from LLM.";
  } catch (error) {
    console.error('Error calling LLM:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to communicate with LLM: ${error.message}`);
    }
    throw new Error('An unknown error occurred while communicating with LLM.');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      task = "qa",
      markdownContent,
      userPrompt,
    } = body;

    if (task === "plan" && !userPrompt) {
      return NextResponse.json(
        { error: "Invalid request: 'userPrompt' is required for 'plan' task." },
        { status: 400 }
      );
    }
    if (
      (task === "qa" || task === "synthesize") &&
      (!markdownContent || !userPrompt)
    ) {
      return NextResponse.json(
        {
          error: "Invalid request: 'markdownContent' and 'userPrompt' are required for 'qa' and 'synthesize' tasks.",
        },
        { status: 400 }
      );
    }

    const llmResponse = await callLLM(task, { markdownContent, userPrompt });

    if (task === "plan") {
      try {
        const plan = JSON.parse(llmResponse);
        if (!plan.mode || !plan.urls || plan.urls.length === 0) {
          throw new Error("AI planner returned an invalid plan object.");
        }
        return NextResponse.json(plan);
      } catch (e) {
        console.error("Failed to parse plan from LLM:", llmResponse);
        return NextResponse.json(
          { error: "AI planner returned invalid JSON." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ response: llmResponse });
  } catch (error) {
    console.error('API Route /api/llm-handler Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An internal server error occurred on the API route.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 