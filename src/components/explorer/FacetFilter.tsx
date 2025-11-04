import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface FacetOption {
  label: string;
  value: string;
  count: number;
}

interface FacetFilterProps {
  title: string;
  options: FacetOption[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  className?: string;
}

export function FacetFilter({ title, options, selected, onSelectionChange, className }: FacetFilterProps) {
  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onSelectionChange(selected.filter((v) => v !== value));
    } else {
      onSelectionChange([...selected, value]);
    }
  };

  return (
    <Card className={cn("p-4", className)}>
      <h3 className="font-semibold text-sm mb-3">{title}</h3>
      <ScrollArea className="h-48">
        <div className="space-y-2">
          {options.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <Checkbox
                id={`facet-${option.value}`}
                checked={selected.includes(option.value)}
                onCheckedChange={() => handleToggle(option.value)}
              />
              <Label
                htmlFor={`facet-${option.value}`}
                className="flex-1 cursor-pointer text-sm flex items-center justify-between"
              >
                <span>{option.label}</span>
                <Badge variant="secondary" className="ml-2">
                  {option.count}
                </Badge>
              </Label>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}

