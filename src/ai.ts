import axios from "axios";

/**
 * Communicates with GapGPT API securely targets the gapgpt-qwen-3.6 model.
 */
export async function askGapGPT(messages: { role: string; content: string }[]): Promise<string> {
  const apiKey = process.env.GAPGPT_API_KEY;
  if (!apiKey) {
    return "GapGPT is not configured. Please add GAPGPT_API_KEY to your environment secrets in the AI Studio sidebar.";
  }

  try {
    const response = await axios.post(
      "https://api.gapgpt.app/v1/chat/completions",
      {
        model: "gapgpt-qwen-3.6",
        messages,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 25000,
      }
    );

    if (response.data && response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    }
    return "Error: Received empty response from GapGPT.";
  } catch (error: any) {
    console.error("GapGPT Error Details:", error?.response?.data || error.message);
    return `Failed to fetch response from GapGPT: ${error?.response?.data?.error?.message || error.message}`;
  }
}
