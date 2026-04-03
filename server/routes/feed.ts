import { Router } from "express";

export function createFeedRouter(): Router {
  const router = Router();

  router.get("/api/rss-feed", async (req, res) => {
    try {
      const response = await fetch("https://www.ezrabrand.com/feed");
      const xmlText = await response.text();
      
      const items: Array<{title: string; link: string; pubDate: string; description: string}> = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      
      while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemXml = match[1];
        const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || 
                      itemXml.match(/<title>(.*?)<\/title>/)?.[1] || "";
        const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || "";
        const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
        const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || 
                           itemXml.match(/<description>(.*?)<\/description>/)?.[1] || "";
        
        items.push({ title, link, pubDate, description });
      }
      
      res.json({ items: items.slice(0, 5) });
    } catch (error) {
      console.error("RSS feed fetch error:", error);
      res.status(500).json({ error: "Failed to fetch RSS feed" });
    }
  });

  router.get("/api/rss-feed-full", async (req, res) => {
    try {
      const response = await fetch("https://www.ezrabrand.com/feed");
      const xmlText = await response.text();
      
      const items: Array<{
        title: string;
        link: string;
        pubDate: string;
        description: string;
        content: string;
        author: string;
      }> = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      
      while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemXml = match[1];
        const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || 
                      itemXml.match(/<title>(.*?)<\/title>/)?.[1] || "";
        const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || "";
        const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
        const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || 
                           itemXml.match(/<description>(.*?)<\/description>/)?.[1] || "";
        
        const contentMatch = itemXml.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);
        const content = contentMatch?.[1] || description;
        
        const authorMatch = itemXml.match(/<dc:creator><!\[CDATA\[(.*?)\]\]><\/dc:creator>/) ||
                           itemXml.match(/<dc:creator>(.*?)<\/dc:creator>/);
        const author = authorMatch?.[1] || "";
        
        items.push({ title, link, pubDate, description, content, author });
      }
      
      res.json({ items: items.slice(0, 20) });
    } catch (error) {
      console.error("RSS feed full content fetch error:", error);
      res.status(500).json({ error: "Failed to fetch RSS feed" });
    }
  });

  router.get("/api/daf-yomi", async (req, res) => {
    try {
      const response = await fetch("https://www.sefaria.org/api/calendars");
      const data = await response.json();
      
      const dafYomi = data.calendar_items?.find(
        (item: any) => item.title?.en === "Daf Yomi"
      );
      
      if (dafYomi) {
        res.json({
          titleEn: dafYomi.displayValue?.en || "",
          titleHe: dafYomi.displayValue?.he || "",
          ref: dafYomi.ref || "",
          url: dafYomi.url || "",
          date: data.date || new Date().toISOString().split("T")[0]
        });
      } else {
        res.status(404).json({ error: "Daf Yomi not found in calendar" });
      }
    } catch (error) {
      console.error("Daf Yomi fetch error:", error);
      res.status(500).json({ error: "Failed to fetch Daf Yomi" });
    }
  });

  return router;
}
