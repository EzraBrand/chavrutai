import { normalizeSefariaTractateName } from "@shared/tractates";

const sefariaAPIBaseURL = "https://www.sefaria.org/api";

export interface RawSefariaSource {
  reference: string;
  tractate: string;
  page: string;
  hebrewSections: string[];
  englishSections: string[];
  sectionRefs: string[];
}

export async function fetchSefariaRawSource(reference: string): Promise<RawSefariaSource> {
  let parsedTractate = "";
  let parsedPage = "";

  const crossPageMatch = reference.match(/^([^.]+)\.(\d+[ab])\.(\d+)-(\d+[ab])\.(\d+)$/);
  if (crossPageMatch) {
    parsedTractate = crossPageMatch[1];
    parsedPage = crossPageMatch[2];
  } else {
    const singlePageMatch = reference.match(/^([^.]+)\.(\d+[ab])(?:\.(\d+(?:-\d+)?))?$/);
    if (!singlePageMatch) {
      throw new Error("Invalid reference format");
    }
    parsedTractate = singlePageMatch[1];
    parsedPage = singlePageMatch[2];
  }

  const normalizedTractate = normalizeSefariaTractateName(parsedTractate);
  const crossPageRangeMatch = reference.match(/^([^.]+)\.(\d+[ab])\.(\d+)-(\d+[ab])\.(\d+)$/);

  const hebrewSections: string[] = [];
  const englishSections: string[] = [];
  const sectionRefs: string[] = [];

  if (crossPageRangeMatch) {
    const startPage = crossPageRangeMatch[2];
    const startSection = parseInt(crossPageRangeMatch[3]);
    const endPage = crossPageRangeMatch[4];
    const endSection = parseInt(crossPageRangeMatch[5]);
    const pagesToFetch: string[] = [];
    const startPageNum = parseInt(startPage.slice(0, -1));
    const startPageSide = startPage.slice(-1);
    const endPageNum = parseInt(endPage.slice(0, -1));
    const endPageSide = endPage.slice(-1);

    if (startPageNum === endPageNum) {
      if (startPageSide === "a") {
        pagesToFetch.push(`${startPageNum}a`);
        if (endPageSide === "b") {
          pagesToFetch.push(`${startPageNum}b`);
        }
      } else {
        pagesToFetch.push(`${startPageNum}b`);
      }
    } else {
      for (let folio = startPageNum; folio <= endPageNum; folio += 1) {
        if (folio === startPageNum) {
          if (startPageSide === "a") {
            pagesToFetch.push(`${folio}a`, `${folio}b`);
          } else {
            pagesToFetch.push(`${folio}b`);
          }
        } else if (folio === endPageNum) {
          pagesToFetch.push(`${folio}a`);
          if (endPageSide === "b") {
            pagesToFetch.push(`${folio}b`);
          }
        } else {
          pagesToFetch.push(`${folio}a`, `${folio}b`);
        }
      }
    }

    for (const pageRef of pagesToFetch) {
      const sefariaRef = `${normalizedTractate}.${pageRef}`;
      const response = await fetch(`${sefariaAPIBaseURL}/texts/${sefariaRef}?lang=bi&commentary=0`);
      if (!response.ok) {
        throw new Error("Failed to fetch raw text from Sefaria");
      }

      const sefariaData = await response.json();
      let pageHebrew = Array.isArray(sefariaData.he) ? sefariaData.he : [sefariaData.he || ""];
      let pageEnglish = Array.isArray(sefariaData.text) ? sefariaData.text : [sefariaData.text || ""];
      let pageSectionRefs = pageHebrew.map((_: string, index: number) => `${normalizedTractate}.${pageRef}.${index + 1}`);

      if (pageRef === startPage) {
        pageHebrew = pageHebrew.slice(startSection - 1);
        pageEnglish = pageEnglish.slice(startSection - 1);
        pageSectionRefs = pageSectionRefs.slice(startSection - 1);
      }

      if (pageRef === endPage) {
        pageHebrew = pageHebrew.slice(0, endSection);
        pageEnglish = pageEnglish.slice(0, endSection);
        pageSectionRefs = pageSectionRefs.slice(0, endSection);
      }

      hebrewSections.push(...pageHebrew);
      englishSections.push(...pageEnglish);
      sectionRefs.push(...pageSectionRefs);
    }
  } else {
    const sefariaRef = `${normalizedTractate}.${parsedPage}`;
    const response = await fetch(`${sefariaAPIBaseURL}/texts/${sefariaRef}?lang=bi&commentary=0`);
    if (!response.ok) {
      throw new Error("Failed to fetch raw text from Sefaria");
    }

    const sefariaData = await response.json();
    let pageHebrew = Array.isArray(sefariaData.he) ? sefariaData.he : [sefariaData.he || ""];
    let pageEnglish = Array.isArray(sefariaData.text) ? sefariaData.text : [sefariaData.text || ""];
    let pageSectionRefs = pageHebrew.map((_: string, index: number) => `${normalizedTractate}.${parsedPage}.${index + 1}`);

    const rangeMatch = reference.match(/^([^.]+)\.(\d+[ab])\.(\d+)-(\d+)$/);
    const singleSectionMatch = reference.match(/^([^.]+)\.(\d+[ab])\.(\d+)$/);

    if (rangeMatch) {
      const startIdx = parseInt(rangeMatch[3]) - 1;
      const endIdx = parseInt(rangeMatch[4]);
      pageHebrew = pageHebrew.slice(startIdx, endIdx);
      pageEnglish = pageEnglish.slice(startIdx, endIdx);
      pageSectionRefs = pageSectionRefs.slice(startIdx, endIdx);
    } else if (singleSectionMatch) {
      const sectionIdx = parseInt(singleSectionMatch[3]) - 1;
      pageHebrew = sectionIdx >= 0 && sectionIdx < pageHebrew.length ? [pageHebrew[sectionIdx]] : [];
      pageEnglish = sectionIdx >= 0 && sectionIdx < pageEnglish.length ? [pageEnglish[sectionIdx]] : [];
      pageSectionRefs = sectionIdx >= 0 && sectionIdx < pageSectionRefs.length ? [pageSectionRefs[sectionIdx]] : [];
    }

    hebrewSections.push(...pageHebrew);
    englishSections.push(...pageEnglish);
    sectionRefs.push(...pageSectionRefs);
  }

  return {
    reference,
    tractate: parsedTractate,
    page: parsedPage,
    hebrewSections,
    englishSections,
    sectionRefs,
  };
}
