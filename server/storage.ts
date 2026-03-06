import { type User, type InsertUser, type Text, type InsertText, type Bookmark, type InsertBookmark, type DictionaryEntry, type SearchRequest, type BrowseRequest, type AutosuggestRequest, type AutosuggestResponse } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Text methods
  getText(work: string, tractate: string, chapter: number, folio: number, side: string): Promise<Text | undefined>;
  getTexts(work: string, tractate?: string): Promise<Text[]>;
  createText(text: InsertText): Promise<Text>;
  
  // Bookmark methods
  getBookmarks(userId: string): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(id: string): Promise<void>;
  
  // Dictionary methods
  searchEntries(request: SearchRequest): Promise<DictionaryEntry[]>;
  browseByLetter(request: BrowseRequest): Promise<DictionaryEntry[]>;
  getAutosuggest(request: AutosuggestRequest): Promise<AutosuggestResponse>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private texts: Map<string, Text>;
  private bookmarks: Map<string, Bookmark>;

  constructor() {
    this.users = new Map();
    this.texts = new Map();
    this.bookmarks = new Map();
    
    // No sample data - fetch from Sefaria API
  }

  // Removed sample data - fetch from Sefaria API instead

  private getTextKey(work: string, tractate: string, chapter: number, folio: number, side: string): string {
    return `${work}:${tractate}:${chapter}:${folio}:${side}`;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getText(work: string, tractate: string, chapter: number, folio: number, side: string): Promise<Text | undefined> {
    const key = this.getTextKey(work, tractate, chapter, folio, side);
    return this.texts.get(key);
  }

  async getTexts(work: string, tractate?: string): Promise<Text[]> {
    return Array.from(this.texts.values()).filter(text => 
      text.work === work && (!tractate || text.tractate === tractate)
    );
  }

  async createText(insertText: InsertText): Promise<Text> {
    const id = randomUUID();
    const sectionSegmentations = insertText.sectionSegmentations
      ? JSON.parse(JSON.stringify(insertText.sectionSegmentations)) as Text["sectionSegmentations"]
      : null;
    const text: Text = { 
      ...insertText, 
      id,
      sefariaRef: insertText.sefariaRef || null,
      hebrewSections: insertText.hebrewSections ? [...insertText.hebrewSections] : null,
      englishSections: insertText.englishSections ? [...insertText.englishSections] : null,
      sectionSegmentations,
      nextPageFirstSection: (insertText.nextPageFirstSection && 
        typeof insertText.nextPageFirstSection === 'object' &&
        'hebrew' in insertText.nextPageFirstSection &&
        'english' in insertText.nextPageFirstSection) 
        ? insertText.nextPageFirstSection as { hebrew: string; english: string }
        : null
    };
    const key = this.getTextKey(text.work, text.tractate, text.chapter, text.folio, text.side);
    this.texts.set(key, text);
    return text;
  }

  async getBookmarks(userId: string): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values()).filter(bookmark => bookmark.userId === userId);
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const id = randomUUID();
    const bookmark: Bookmark = { 
      ...insertBookmark, 
      id,
      userId: insertBookmark.userId || null,
      textId: insertBookmark.textId || null,
      notes: insertBookmark.notes || null
    };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }

  async deleteBookmark(id: string): Promise<void> {
    this.bookmarks.delete(id);
  }

  // Dictionary methods - delegate to SefariaAPI
  async searchEntries(request: SearchRequest): Promise<DictionaryEntry[]> {
    return sefariaAPI.searchEntries(request);
  }

  async browseByLetter(request: BrowseRequest): Promise<DictionaryEntry[]> {
    return sefariaAPI.browseByLetter(request);
  }

  async getAutosuggest(request: AutosuggestRequest): Promise<AutosuggestResponse> {
    return sefariaAPI.getAutosuggest(request);
  }
}

// Sefaria API implementation for dictionary functionality
export class SefariaAPI {
  private baseURL = "https://www.sefaria.org/api";

  private flattenSenses(senses: any[]): any[] {
    const flattenedSenses: any[] = [];
    
    for (const sense of senses) {
      if (sense.definition) {
        // Include sense number if present (e.g., "1)", "—2)")
        // Remove leading dashes from sense numbers (e.g., "—2)" -> "2)")
        let cleanNumber = sense.number || '';
        if (cleanNumber) {
          cleanNumber = cleanNumber.replace(/^[—–-]+/, '').trim();
        }
        const numberPrefix = cleanNumber ? `${cleanNumber} ` : '';
        flattenedSenses.push({
          definition: numberPrefix + this.transformHyperlinks(sense.definition),
          grammar: sense.grammar
        });
      }
      
      if (Array.isArray(sense.senses)) {
        const nestedFlattened = this.flattenSenses(sense.senses);
        for (const nestedSense of nestedFlattened) {
          const grammarInfo = sense.grammar || nestedSense.grammar;
          let prefix = '';
          if (grammarInfo?.verbal_stem) {
            const binyanForm = grammarInfo.binyan_form?.join(', ') || '';
            prefix = `<strong>${grammarInfo.verbal_stem}</strong>${binyanForm ? ` - <span dir="rtl">${binyanForm}</span>` : ''} `;
          }
          flattenedSenses.push({
            definition: prefix + nestedSense.definition,
            grammar: grammarInfo
          });
        }
      }
    }
    
    return flattenedSenses;
  }

  private transformHyperlinks(htmlContent: string): string {
    // Handle undefined or null content
    if (!htmlContent || typeof htmlContent !== 'string') {
      console.log('DEBUG: transformHyperlinks received invalid content:', htmlContent);
      return '';
    }

    // Transform Sefaria internal links to external URLs
    let transformed = htmlContent;

    // Pattern 1: Jerusalem Talmud links - add Sefaria base URL and use data-ref for text
    // <a class="refLink" href="Jerusalem_Talmud_Nedarim.5.6.3" data-ref="Jerusalem Talmud Nedarim 5:6">text</a>
    // -> <a class="refLink" href="https://www.sefaria.org/Jerusalem_Talmud_Nedarim.5.6.3" data-ref="Jerusalem Talmud Nedarim 5:6">Jerusalem Talmud Nedarim 5:6</a>
    transformed = transformed.replace(
      /<a([^>]*?)href="(Jerusalem_Talmud_[^"]+)"([^>]*?)data-ref="([^"]*)"([^>]*)>([^<]+)<\/a>/g,
      (match, before, url, middle, dataRef, after, text) => {
        return `<a${before}href="https://www.sefaria.org/${url}"${middle}data-ref="${dataRef}"${after}>${dataRef}</a>`;
      }
    );

    // Pattern 1b: Handle Jerusalem Talmud links where data-ref comes before href
    transformed = transformed.replace(
      /<a([^>]*?)data-ref="([^"]*)"([^>]*?)href="(Jerusalem_Talmud_[^"]+)"([^>]*)>([^<]+)<\/a>/g,
      (match, before, dataRef, middle, url, after, text) => {
        return `<a${before}data-ref="${dataRef}"${middle}href="https://www.sefaria.org/${url}"${after}>${dataRef}</a>`;
      }
    );

    // Pattern 2: href="/Jastrow,_something.1" -> href="https://www.sefaria.org/Jastrow%2C_something"
    // Keep original text for Jastrow entries
    transformed = transformed.replace(
      /href="\/Jastrow,_([^"]+)\.1"/g,
      'href="https://www.sefaria.org/Jastrow%2C_$1"'
    );

    // Pattern 3: Primary works links - replace href and use data-ref for text content
    // <a class="refLink" href="/Bamidbar_Rabbah.10.8" data-ref="Bamidbar Rabbah 10:8">text</a> 
    // -> <a class="refLink" href="https://www.sefaria.org/Bamidbar_Rabbah.10.8" data-ref="Bamidbar Rabbah 10:8">Bamidbar Rabbah 10:8</a>
    transformed = transformed.replace(
      /<a([^>]*?)href="\/([^"\/][^"]*\.[^"]+)"([^>]*?)data-ref="([^"]*)"([^>]*)>([^<]+)<\/a>/g,
      (match, before, url, middle, dataRef, after, text) => {
        return `<a${before}href="https://www.sefaria.org/${url}"${middle}data-ref="${dataRef}"${after}>${dataRef}</a>`;
      }
    );

    // Pattern 4: Handle links where data-ref comes before href
    transformed = transformed.replace(
      /<a([^>]*?)data-ref="([^"]*)"([^>]*?)href="\/([^"\/][^"]*\.[^"]+)"([^>]*)>([^<]+)<\/a>/g,
      (match, before, dataRef, middle, url, after, text) => {
        return `<a${before}data-ref="${dataRef}"${middle}href="https://www.sefaria.org/${url}"${after}>${dataRef}</a>`;
      }
    );

    return transformed;
  }

  async searchEntries(request: SearchRequest): Promise<DictionaryEntry[]> {
    try {
      console.log('Improved search for:', request.query);

      // First, try direct word lookup for exact matches
      const directResponse = await fetch(`${this.baseURL}/words/${encodeURIComponent(request.query)}`);
      let allEntries: DictionaryEntry[] = [];


      if (directResponse.ok) {
        const directData = await directResponse.json();
        if (Array.isArray(directData)) {
          const directEntries = directData
            .filter((entry: any) => {
              return entry.parent_lexicon === 'Jastrow Dictionary' &&
                     entry.headword &&
                     entry.content &&
                     Array.isArray(entry.content.senses);
            })
            .map((entry: any) => ({
              headword: entry.headword,
              rid: entry.rid,
              parent_lexicon: entry.parent_lexicon,
              language_code: entry.language_code,
              language_reference: entry.language_reference,
              content: {
                ...entry.content,
                senses: this.flattenSenses(entry.content.senses)
              },
              refs: entry.refs,
              prev_hw: entry.prev_hw,
              next_hw: entry.next_hw
            }));
          allEntries.push(...directEntries);
          console.log('Direct search found:', directEntries.length, 'entries');
        }
      }

      // If direct search found results, return them
      if (allEntries.length > 0) {
        console.log('Returning direct search results:', allEntries.length);
        return allEntries;
      }

      // If no direct results, use completion API to find similar words
      console.log('No direct results, trying completion API...');
      const completionResponse = await fetch(`${this.baseURL}/words/completion/${encodeURIComponent(request.query)}`);

      if (!completionResponse.ok) {
        console.log('Completion API failed, returning empty results');
        return [];
      }

      const completionData = await completionResponse.json();
      if (!Array.isArray(completionData) || completionData.length === 0) {
        console.log('No completion suggestions found');
        return [];
      }

      console.log('Found completion suggestions:', completionData.length);

      // Try to find dictionary entries for the top completion suggestions
      const searchPromises = completionData.slice(0, 5).map(async (suggestion: any) => {
        if (!Array.isArray(suggestion) || suggestion.length < 2) return [];

        const headword = suggestion[1] || suggestion[0]; // Use voweled version first
        try {
          const response = await fetch(`${this.baseURL}/words/${encodeURIComponent(headword)}`);
          if (!response.ok) return [];

          const data = await response.json();
          if (!Array.isArray(data)) return [];

          return data
            .filter((entry: any) => {
              return entry.parent_lexicon === 'Jastrow Dictionary' &&
                     entry.headword &&
                     entry.content &&
                     Array.isArray(entry.content.senses);
            })
            .map((entry: any) => ({
              headword: entry.headword,
              rid: entry.rid,
              parent_lexicon: entry.parent_lexicon,
              language_code: entry.language_code,
              language_reference: entry.language_reference,
              content: {
                ...entry.content,
                senses: this.flattenSenses(entry.content.senses)
              },
              refs: entry.refs,
              prev_hw: entry.prev_hw,
              next_hw: entry.next_hw
            }));
        } catch (error) {
          console.log('Error searching for suggestion:', headword, error);
          return [];
        }
      });

      const searchResults = await Promise.all(searchPromises);
      const foundEntries = searchResults.flat();

      // Remove duplicates by rid
      const uniqueEntries = Array.from(
        new Map(foundEntries.map(entry => [entry.rid, entry])).values()
      );

      console.log('Search via completion found:', uniqueEntries.length, 'unique entries');
      return uniqueEntries;

    } catch (error) {
      console.error('Search API error:', error);
      return [];
    }
  }

  async browseByLetter(request: BrowseRequest): Promise<DictionaryEntry[]> {
    try {
      console.log('Browse by letter - using search for letter:', request.letter);

      // Start with the initial search for the letter
      const initialResults = await this.searchEntries({ query: request.letter });
      console.log('Initial browse results:', initialResults.length, 'entries');

      if (initialResults.length === 0) {
        return [];
      }

      // Collect all results starting with the gathered entries
      const allResults: DictionaryEntry[] = [...initialResults];
      const processedIds = new Set(initialResults.map(entry => entry.rid));

      // Try to get more entries by following the next_hw chain
      // Reduce the number of additional entries for better performance
      const maxAdditionalEntries = 8; // Reduced from 15 for faster response
      let additionalCount = 0;
      let currentHeadwords = initialResults.map(entry => entry.next_hw).filter(Boolean);

      // Make parallel requests for better performance
      while (currentHeadwords.length > 0 && additionalCount < maxAdditionalEntries) {
        console.log(`Following next_hw chain in parallel for: ${currentHeadwords.slice(0, 3).join(', ')}`);

        try {
          // Process up to 3 headwords in parallel to avoid overwhelming the API
          const batchSize = Math.min(3, currentHeadwords.length);
          const currentBatch = currentHeadwords.slice(0, batchSize);
          
          const searchPromises = currentBatch
            .filter((headword): headword is string => Boolean(headword))
            .map(headword => 
              this.searchEntries({ query: headword }).catch(error => {
                console.log(`Error searching for ${headword}:`, error instanceof Error ? error.message : String(error));
                return [];
              })
            );

          const batchResults = await Promise.all(searchPromises);
          const newHeadwords: string[] = [];

          for (const nextResults of batchResults) {
            if (nextResults.length === 0) continue;

            // Check if the first result starts with the same letter
            const nextEntry = nextResults[0];
            if (!nextEntry.headword.startsWith(request.letter)) {
              console.log(`Reached different letter: ${nextEntry.headword} - stopping chain`);
              continue;
            }

            // Add new entries that we haven't seen before
            for (const entry of nextResults) {
              if (!processedIds.has(entry.rid)) {
                allResults.push(entry);
                processedIds.add(entry.rid);
                additionalCount++;
                
                // Collect next headwords for the next batch
                if (entry.next_hw && additionalCount < maxAdditionalEntries) {
                  newHeadwords.push(entry.next_hw);
                }
              }
            }
          }

          // Update currentHeadwords for next iteration
          currentHeadwords = [...currentHeadwords.slice(batchSize), ...newHeadwords];

        } catch (error) {
          console.log('Error following chain, stopping:', error instanceof Error ? error.message : String(error));
          break;
        }
      }

      console.log(`Browse by letter final results: ${allResults.length} entries (${additionalCount} additional)`);
      return allResults;

    } catch (error) {
      console.error('Browse API error:', error);
      return [];
    }
  }

  async getAutosuggest(request: AutosuggestRequest): Promise<AutosuggestResponse> {
    try {
      console.log('Making autosuggest request to:', `${this.baseURL}/words/completion/${encodeURIComponent(request.query)}`);

      const response = await fetch(`${this.baseURL}/words/completion/${encodeURIComponent(request.query)}`);
      if (!response.ok) {
        console.error('Autosuggest API response not ok:', response.status, response.statusText);
        return [];
      }

      const data = await response.json();
      console.log('Autosuggest API raw response:', data);

      // Validate that we got an array
      if (!Array.isArray(data)) {
        console.error('Autosuggest API did not return array:', typeof data, data);
        return [];
      }

      // Transform the response from array of arrays to our expected format
      const suggestions: AutosuggestResponse = data
        .filter((item: any) => Array.isArray(item) && item.length >= 2)
        .map((item: any) => ({
          unvoweled: item[0],
          voweled: item[1] || item[0] // fallback to unvoweled if voweled is empty
        }))
        .slice(0, 10); // Limit to 10 suggestions

      console.log('Transformed autosuggest suggestions:', suggestions.length, suggestions);
      return suggestions;
    } catch (error) {
      console.error('Autosuggest API error:', error);
      return [];
    }
  }
}

const sefariaAPI = new SefariaAPI();

export const storage = new MemStorage();
