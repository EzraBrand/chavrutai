import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface QuickSearchProps {
  className?: string;
}

export function QuickSearch({ className = "" }: QuickSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Strip leading/trailing punctuation and collapse whitespace
      const sanitized = searchQuery
        .trim()
        .replace(/^[,;:.!?]+|[,;:.!?]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (!sanitized) return;
      navigate(`/search?q=${encodeURIComponent(sanitized)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className={`flex flex-col gap-2 ${className}`} data-testid="quick-search-form">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search Talmud & Bible..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="quick-search-input"
        />
      </div>
      <Button type="submit" variant="outline" className="w-full" data-testid="quick-search-button">
        Search
      </Button>
    </form>
  );
}
