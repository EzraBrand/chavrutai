import { Link } from "wouter";
import { getTractateSlug } from "@shared/tractates";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DafYomiData {
  titleEn: string;
  titleHe: string;
  ref: string;
  url: string;
  date: string;
}

interface DafYomiWidgetProps {
  className?: string;
  compact?: boolean;
}

function parseDafYomiRef(ref: string): { tractate: string; folio: string } | null {
  const match = ref.match(/^([A-Za-z\s]+)\s+(\d+)([ab])?$/);
  if (match) {
    const tractate = getTractateSlug(match[1].trim());
    const folioNum = match[2];
    const side = match[3] || 'a';
    return { tractate, folio: `${folioNum}${side}` };
  }
  return null;
}

export function DafYomiWidget({ className = "", compact = false }: DafYomiWidgetProps) {
  const { data: dafYomi, isLoading } = useQuery<DafYomiData>({
    queryKey: ["/api/daf-yomi"],
  });

  if (compact) {
    if (isLoading) {
      return (
        <Card className={`hover:shadow-lg transition-shadow duration-200 ${className}`}>
          <CardContent className="p-4 flex flex-col h-full animate-pulse">
            <div className="h-5 bg-secondary rounded w-32 mb-2"></div>
            <div className="h-4 bg-secondary rounded w-24 mb-3 flex-1"></div>
            <div className="h-9 bg-secondary rounded w-full"></div>
          </CardContent>
        </Card>
      );
    }

    if (!dafYomi) {
      return (
        <Card className={`hover:shadow-lg transition-shadow duration-200 ${className}`}>
          <CardContent className="p-4 flex flex-col h-full" data-testid="daf-yomi-widget-empty">
            <h3 className="font-semibold text-foreground mb-2">Today's Daf Yomi</h3>
            <p className="text-muted-foreground text-sm flex-1">Unable to load</p>
          </CardContent>
        </Card>
      );
    }

    const parsed = parseDafYomiRef(dafYomi.ref);
    const studyLink = parsed 
      ? `/talmud/${parsed.tractate}/${parsed.folio}`
      : `/talmud`;

    return (
      <Card className={`hover:shadow-lg transition-shadow duration-200 ${className}`}>
        <CardContent className="p-4 flex flex-col h-full" data-testid="daf-yomi-widget">
          <h3 className="font-semibold text-foreground mb-2">Today's Daf Yomi</h3>
          <p className="text-muted-foreground text-sm mb-3 flex-1" data-testid="daf-yomi-title-en">
            {dafYomi.titleEn}
          </p>
          <Link href={studyLink} className="block">
            <Button variant="outline" className="w-full" data-testid="daf-yomi-study-link">
              Study It Now
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-secondary/50 rounded-lg p-6 ${className}`}>
        <div className="h-6 bg-secondary rounded w-40 mb-4"></div>
        <div className="h-8 bg-secondary rounded w-1/2 mb-3"></div>
        <div className="h-6 bg-secondary rounded w-1/3"></div>
      </div>
    );
  }

  if (!dafYomi) {
    return (
      <div className={`bg-secondary/30 rounded-lg p-6 ${className}`} data-testid="daf-yomi-widget-empty">
        <h3 className="text-lg font-semibold text-foreground mb-4">Today's Daf Yomi</h3>
        <p className="text-muted-foreground">
          Unable to load today's daf. Please try again later.
        </p>
      </div>
    );
  }

  const parsed = parseDafYomiRef(dafYomi.ref);
  const studyLink = parsed 
    ? `/talmud/${parsed.tractate}/${parsed.folio}`
    : `/talmud`;

  return (
    <div className={`bg-secondary/30 rounded-lg p-6 ${className}`} data-testid="daf-yomi-widget">
      <h3 className="text-lg font-semibold text-foreground mb-4">Today's Daf Yomi</h3>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold text-foreground mb-1" data-testid="daf-yomi-title-en">
            {dafYomi.titleEn}
          </p>
          <p className="text-xl text-muted-foreground font-hebrew" dir="rtl" data-testid="daf-yomi-title-he">
            {dafYomi.titleHe}
          </p>
        </div>
        <Link
          href={studyLink}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          data-testid="daf-yomi-study-link"
        >
          Study It Now
        </Link>
      </div>
    </div>
  );
}
