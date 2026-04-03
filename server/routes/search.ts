import { Router } from "express";
import { z } from "zod";
import { textSearchRequestSchema, type SearchResult, type TextSearchResponse } from "@shared/schema";

export function createSearchRouter(): Router {
  const router = Router();

  router.get("/api/search/text", async (req, res) => {
    try {
      const { query, page, pageSize, type, exact } = textSearchRequestSchema.parse(req.query);
      
      const fetchSize = pageSize * 2;
      const from = (page - 1) * fetchSize;
      
      const pathFilters: any[] = [];
      if (type === "all" || type === "talmud") {
        pathFilters.push({ prefix: { "path": "Talmud/Bavli/Seder " } });
      }
      if (type === "all" || type === "bible") {
        pathFilters.push({ prefix: { "path": "Tanakh/Torah" } });
        pathFilters.push({ prefix: { "path": "Tanakh/Prophets" } });
        pathFilters.push({ prefix: { "path": "Tanakh/Writings" } });
      }
      
      const esQuery = {
        size: fetchSize,
        from: from,
        query: {
          bool: {
            must: {
              match_phrase: {
                exact: {
                  query: query,
                  slop: exact ? 0 : 3
                }
              }
            },
            filter: [
              {
                bool: {
                  should: pathFilters,
                  minimum_should_match: 1
                }
              },
              {
                bool: {
                  should: [
                    { term: { lang: "en" } },
                    { term: { lang: "he" } }
                  ],
                  minimum_should_match: 1
                }
              }
            ],
            should: [
              { match_phrase: { version: "William Davidson Edition - English" } },
              { match_phrase: { version: "The Koren Jerusalem Bible" } },
              { term: { lang: "he" } }
            ],
            minimum_should_match: 1
          }
        },
        highlight: {
          pre_tags: ["<mark>"],
          post_tags: ["</mark>"],
          fields: {
            exact: {
              fragment_size: 200
            }
          }
        },
        sort: [
          { comp_date: {} },
          { order: {} }
        ]
      };

      console.log(`Searching Sefaria for: "${query}" (type: ${type}, exact: ${exact}, page ${page}, size ${pageSize})`);
      
      const response = await fetch("https://www.sefaria.org/api/search/text/_search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(esQuery)
      });

      if (!response.ok) {
        console.error(`Sefaria search error: ${response.status} ${response.statusText}`);
        res.status(response.status).json({ error: "Search request failed" });
        return;
      }

      const data = await response.json();
      
      const hitsTotal = data.hits?.total;
      const total = typeof hitsTotal === 'object' ? (hitsTotal?.value ?? 0) : (hitsTotal ?? 0);
      const hits = data.hits?.hits || [];
      
      const allResults: SearchResult[] = hits.map((hit: any) => {
        const source = hit._source || {};
        const ref = source.ref || "";
        const path = source.path || "";
        
        let type: "talmud" | "bible" | "other" = "other";
        if (path.includes("Talmud") || path.includes("Bavli")) {
          type = "talmud";
        } else if (path.includes("Torah") || path.includes("Prophets") || path.includes("Writings") || 
                   path.includes("Genesis") || path.includes("Exodus") || path.includes("Leviticus") ||
                   path.includes("Numbers") || path.includes("Deuteronomy") || path.includes("Tanakh")) {
          type = "bible";
        }
        
        const highlight = hit.highlight?.exact?.[0] || "";
        const text = source.exact || "";
        
        return {
          ref,
          hebrewRef: source.heRef || undefined,
          text: text.substring(0, 300),
          highlight: highlight || undefined,
          path: path || undefined,
          type
        };
      });

      const seenRefs = new Set<string>();
      const deduped = allResults.filter(result => {
        if (seenRefs.has(result.ref)) {
          return false;
        }
        seenRefs.add(result.ref);
        return true;
      });
      
      const results: SearchResult[] = deduped.slice(0, pageSize);
      
      const uniqueTotal = total <= fetchSize ? deduped.length : Math.ceil(total / 2);
      const totalPages = Math.ceil(uniqueTotal / pageSize);

      const searchResponse: TextSearchResponse = {
        results,
        total: uniqueTotal,
        page,
        pageSize,
        totalPages,
        query
      };

      res.json(searchResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid search parameters", details: error.errors });
      } else {
        console.error("Search error:", error);
        res.status(500).json({ error: "Search failed" });
      }
    }
  });

  return router;
}
