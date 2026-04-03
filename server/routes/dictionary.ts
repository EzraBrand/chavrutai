import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { searchRequestSchema, browseRequestSchema, autosuggestRequestSchema } from "@shared/schema";

export function createDictionaryRouter(): Router {
  const router = Router();

  router.get("/api/dictionary/search", async (req, res) => {
    try {
      const { query } = searchRequestSchema.parse(req.query);
      const entries = await storage.searchEntries({ query });
      res.json(entries);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid search query" });
      } else {
        console.error("Dictionary search error:", error);
        res.status(500).json({ error: "Dictionary search failed" });
      }
    }
  });

  router.get("/api/dictionary/browse", async (req, res) => {
    try {
      const { letter } = browseRequestSchema.parse(req.query);
      const entries = await storage.browseByLetter({ letter });
      res.json(entries);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid letter parameter" });
      } else {
        console.error("Dictionary browse error:", error);
        res.status(500).json({ error: "Dictionary browse failed" });
      }
    }
  });

  router.get("/api/dictionary/autosuggest", async (req, res) => {
    try {
      const { query } = autosuggestRequestSchema.parse(req.query);
      const suggestions = await storage.getAutosuggest({ query });
      res.json(suggestions);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid autosuggest query" });
      } else {
        console.error("Dictionary autosuggest error:", error);
        res.status(500).json({ error: "Dictionary autosuggest failed" });
      }
    }
  });

  return router;
}
