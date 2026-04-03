import { Router } from "express";
import { getBlogPostSearch } from "../blog-search";
import { sendChatbotAlert } from "../lib/gmail-client";

export function createChatRouter(): Router {
  const router = Router();
  const blogSearch = getBlogPostSearch();

  const tools = [
    {
      type: "function",
      function: {
        name: "searchBlogPosts",
        description: "Search the Talmud & Tech blog archive for posts related to specific Talmud locations or topics. Returns blog post titles, URLs, and relevant excerpts.",
        parameters: {
          type: "object",
          properties: {
            tractate: {
              type: "string",
              description: "Talmud tractate name (e.g., 'Berakhot', 'Sanhedrin')"
            },
            location: {
              type: "string",
              description: "Talmud location or range (e.g., '7a', '7a.5-22', '7a-7b')"
            },
            keywords: {
              type: "array",
              items: { type: "string" },
              description: "Keywords to search in post titles and content"
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return (default: 5)",
              default: 5
            }
          }
        }
      }
    },
    {
      type: "function",
      function: {
        name: "getBlogPostContent",
        description: "Retrieve the full content of a specific blog post by its ID. Use this after searchBlogPosts to get detailed content of relevant posts.",
        parameters: {
          type: "object",
          properties: {
            postId: {
              type: "string",
              description: "The blog post ID returned from searchBlogPosts"
            }
          },
          required: ["postId"]
        }
      }
    }
  ];

  router.post("/api/chat", async (req, res) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ error: "AI chat is not configured on this server." });
      }

      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const { messages, context } = req.body;
      const userMessages = messages.filter((m: any) => m.role === 'user');
      const userMessage = userMessages[userMessages.length - 1];

      const systemMessage = {
        role: "system",
        content: `You are a knowledgeable Talmud study assistant. You have access to the Talmud & Tech blog archive which contains detailed analysis of Talmud passages.

${context ? `Current Talmud Text Context:
Tractate: ${context.tractate}
Page: ${context.page}
Section: ${context.section || 'all'}

The text below is from Sefaria's Steinsaltz Edition. In the English text:
- **Bolded text** represents Rabbi Adin Even-Israel Steinsaltz's direct translation of the Aramaic/Hebrew
- Regular (non-bolded) text is Steinsaltz's interpretation and explanation
Use this distinction to understand the text, but do NOT mention or explain this formatting distinction in your responses.

Hebrew Text:
${context.hebrewText || 'N/A'}

English Text (Steinsaltz Edition):
${context.englishText || 'N/A'}` : ''}

When answering questions:
1. Use the current Talmud text context when relevant
2. Search the blog archive for related commentary using the searchBlogPosts tool
3. Provide clear, educational responses using markdown formatting where helpful
4. Cite blog posts when referencing them
5. Be direct and specific - avoid vague statements, meta-commentary, or filler like "there may be", "further exploration might be needed", or "for a comprehensive study"`
      };

      const allMessages: any[] = [
        systemMessage,
        ...messages
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: allMessages,
        tools: tools,
        tool_choice: "auto"
      });

      const responseMessage = completion.choices[0].message;

      if (responseMessage.tool_calls) {
        const toolResults: any[] = [];

        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.type !== 'function') continue;
          
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);

          let result: any;

          if (functionName === "searchBlogPosts") {
            const searchResults = blogSearch.search({
              tractate: args.tractate,
              location: args.location,
              keywords: args.keywords,
              limit: args.limit || 5
            });
            result = searchResults;
          } else if (functionName === "getBlogPostContent") {
            const post = blogSearch.getPostById(args.postId);
            result = post ? {
              id: post.id,
              title: post.title,
              contentText: post.contentText.slice(0, 3000),
              blogUrl: post.blogUrl
            } : null;
          }

          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool" as const,
            content: JSON.stringify(result)
          });
        }

        const secondMessages: any[] = [
          ...allMessages,
          responseMessage,
          ...toolResults
        ];

        const finalCompletion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: secondMessages
        });

        const finalMessage = finalCompletion.choices[0].message;
        
        if (userMessage && context) {
          sendChatbotAlert({
            userQuestion: userMessage.content,
            aiResponse: String(finalMessage.content ?? ''),
            fullPrompt: systemMessage.content as string,
            talmudRange: context.range || `${context.tractate} ${context.page}`,
            tractate: context.tractate,
            page: context.page,
            timestamp: new Date()
          }).catch(err => console.error('Email alert failed:', err));
        }
        
        res.json({
          message: finalMessage,
          toolCalls: responseMessage.tool_calls
            .filter(tc => tc.type === 'function')
            .map((tc, i) => ({
              tool: tc.function.name,
              arguments: JSON.parse(tc.function.arguments),
              result: JSON.parse(toolResults[i].content)
            }))
        });
      } else {
        if (userMessage && context) {
          sendChatbotAlert({
            userQuestion: userMessage.content,
            aiResponse: String(responseMessage.content ?? ''),
            fullPrompt: systemMessage.content as string,
            talmudRange: context.range || `${context.tractate} ${context.page}`,
            tractate: context.tractate,
            page: context.page,
            timestamp: new Date()
          }).catch(err => console.error('Email alert failed:', err));
        }
        
        res.json({
          message: responseMessage,
          toolCalls: []
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Chat request failed" });
    }
  });

  return router;
}
