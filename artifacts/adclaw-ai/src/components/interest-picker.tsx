import React, { useState, useRef, useEffect } from "react";
import { useSearchMetaInterests } from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterestPickerProps {
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

export function InterestPicker({ value = [], onChange, className }: InterestPickerProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const debouncedQuery = useDebounce(query, 400);

  const { data, isLoading, isFetching } = useSearchMetaInterests(
    { q: debouncedQuery },
    { query: { enabled: debouncedQuery.length >= 2 } }
  );

  const formatAudience = (num?: number | null) => {
    if (!num) return "";
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  const handleSelect = (name: string) => {
    if (value.length >= 5) return;
    if (!value.includes(name)) {
      onChange([...value, name]);
    }
    setQuery("");
    setIsOpen(false);
  };

  const handleRemove = (nameToRemove: string) => {
    onChange(value.filter((name) => name !== nameToRemove));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = data?.data || [];
  const maxReached = value.length >= 5;

  return (
    <div className={cn("relative flex flex-col gap-3", className)}>
      <div ref={dropdownRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            disabled={maxReached}
            placeholder={maxReached ? "Max 5 reached" : "Search Meta interests..."}
            className="pl-9"
          />
        </div>

        {isOpen && !maxReached && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-md shadow-md overflow-hidden max-h-64 overflow-y-auto">
            {debouncedQuery.length < 2 ? (
              <div className="p-4 text-sm text-center text-muted-foreground">
                Type at least 2 characters to search
              </div>
            ) : isLoading || isFetching ? (
              <div className="p-4 flex items-center justify-center text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-sm text-center text-muted-foreground">
                No interests found
              </div>
            ) : (
              <div className="py-1">
                {results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.name)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 flex items-center justify-between"
                  >
                    <span className="font-medium text-foreground truncate">{item.name}</span>
                    {item.audienceSize && (
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">
                        {formatAudience(item.audienceSize)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((name) => (
            <Badge
              key={name}
              variant="secondary"
              className="bg-secondary text-foreground hover:bg-secondary/80 flex items-center gap-1 pl-3 pr-1 py-1"
            >
              <span>{name}</span>
              <button
                type="button"
                onClick={() => handleRemove(name)}
                className="hover:bg-background/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
                <span className="sr-only">Remove {name}</span>
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
