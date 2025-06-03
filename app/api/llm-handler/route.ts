import { NextRequest, NextResponse } from 'next/server';

async function callLLM(markdownContent: string, userPrompt: string) {
  const apiKey = process.env.LLM_API_KEY;
  const apiUrl = process.env.LLM_API;
  const model = process.env.LLM_API_MODEL;

  if (!apiKey || !apiUrl || !model) {
    console.error('LLM environment variables not set:', { apiKey: !!apiKey, apiUrl: !!apiUrl, model: !!model });
    throw new Error('LLM API Key, URL, or Model is not configured in environment variables.');
  }

  const requestBody = {
    model: model,
    messages: [
      { role: 'system', content: 'You are an assistant that processes provided Markdown text based on a user\'s specific prompt.' },
      { role: 'user', content: `Given the following Markdown content:\n\n<markdown>\n${markdownContent}\n</markdown>\n\nBased on the above, please address the following request: ${userPrompt}` }
    ],
    stream: false // Keeping stream false as per initial setup
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // If parsing error data fails, use status text
        throw new Error(`LLM API request failed with status ${response.status}: ${response.statusText}`);
      }
      console.error('LLM API Error:', errorData);
      throw new Error(`LLM API request failed with status ${response.status}: ${errorData?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No content returned from LLM.';
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
    const { markdownContent, userPrompt } = body;

    if (typeof markdownContent !== 'string' || typeof userPrompt !== 'string') {
      return NextResponse.json({ error: 'Invalid request body: markdownContent (string) and userPrompt (string) are required.' }, { status: 400 });
    }

    const llmResponse = await callLLM(markdownContent, userPrompt);
    return NextResponse.json({ response: llmResponse });
  } catch (error) {
    console.error('API Route /api/llm-handler Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An internal server error occurred on the API route.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 