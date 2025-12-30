import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface PlanningResponse {
  message: string;
  suggestedMilestones?: SuggestedMilestone[];
  suggestedTodos?: SuggestedTodo[];
  phase: "clarification" | "quarterly" | "monthly" | "todos" | "review";
  isComplete: boolean;
}

export interface SuggestedMilestone {
  title: string;
  description: string;
  type: "quarterly" | "monthly";
  quarter?: number;
  month?: number;
  dueDate: string;
}

export interface SuggestedTodo {
  title: string;
  description?: string;
  milestoneTitle?: string;
  dueDate?: string;
}

const SYSTEM_PROMPT = `You are an AI planning assistant for Compass, an app that helps users achieve their annual goals. Your role is to help users break down their annual goals into actionable quarterly milestones, monthly milestones, and specific todos.

## Your Approach
1. **Be conversational and encouraging** - Help users feel motivated about their goals
2. **Ask clarifying questions** - Understand their constraints, time availability, and current situation
3. **Be realistic** - Suggest achievable timelines based on their availability
4. **Use SMART principles** - Goals should be Specific, Measurable, Achievable, Relevant, Time-bound

## Planning Flow
1. **Clarification Phase**: Ask 2-3 questions to understand:
   - Current progress or starting point
   - Weekly time commitment available
   - Any constraints or dependencies
   - Preferred working style

2. **Quarterly Milestones**: Propose 4 quarterly milestones (one per quarter)

3. **Monthly Breakdown**: For each quarter, suggest monthly sub-milestones

4. **Todo Generation**: Create 3-5 actionable todos for the upcoming month

## Response Format
Always respond in this JSON format:
\`\`\`json
{
  "message": "Your conversational response to the user",
  "phase": "clarification|quarterly|monthly|todos|review",
  "suggestedMilestones": [...], // Only when proposing milestones
  "suggestedTodos": [...], // Only when proposing todos
  "isComplete": false // Set to true only when the full plan is finalized
}
\`\`\`

For milestones, use this format:
{
  "title": "Milestone title",
  "description": "Brief description",
  "type": "quarterly|monthly",
  "quarter": 1-4, // For quarterly milestones
  "month": 1-12, // For monthly milestones
  "dueDate": "YYYY-MM-DD"
}

For todos, use this format:
{
  "title": "Todo title",
  "description": "Optional description",
  "milestoneTitle": "Associated milestone title",
  "dueDate": "YYYY-MM-DD"
}

Remember: Be helpful, practical, and encouraging. Help users turn their dreams into actionable plans!`;

export async function chat(
  goalTitle: string,
  goalDescription: string | null,
  targetDate: string,
  messages: ChatMessage[]
): Promise<PlanningResponse> {
  const goalContext = `
## User's Goal
Title: ${goalTitle}
Description: ${goalDescription || "No description provided"}
Target Date: ${targetDate}
Current Date: ${new Date().toISOString().split("T")[0]}
`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: SYSTEM_PROMPT + "\n\n" + goalContext,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    // Parse the JSON response
    const jsonMatch = content.text.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      return {
        message: parsed.message || content.text,
        suggestedMilestones: parsed.suggestedMilestones,
        suggestedTodos: parsed.suggestedTodos,
        phase: parsed.phase || "clarification",
        isComplete: parsed.isComplete || false,
      };
    }

    // If no JSON block, try to parse the whole response
    try {
      const parsed = JSON.parse(content.text);
      return {
        message: parsed.message || content.text,
        suggestedMilestones: parsed.suggestedMilestones,
        suggestedTodos: parsed.suggestedTodos,
        phase: parsed.phase || "clarification",
        isComplete: parsed.isComplete || false,
      };
    } catch {
      // Return as plain message if not JSON
      return {
        message: content.text,
        phase: "clarification",
        isComplete: false,
      };
    }
  } catch (error) {
    console.error("Claude API error:", error);
    throw error;
  }
}
