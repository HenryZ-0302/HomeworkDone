import { useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";

type StreamingOutputDisplayProps = {
  /** The title to display in the card header. */
  title?: string;
  /** A description or subtitle for the card header. */
  description?: string;
  /** The streaming text content to display. Can be null or an empty string for the initial state. */
  output: string | null;
  /** Optional className to apply to the root Card element for custom sizing and styling. */
  className?: string;
  /** Placeholder text to show when the output is empty. */
  placeholder?: string;
};

/**
 * A component designed to display streaming text output, such as from an AI model.
 * It features automatic scrolling to the bottom as new content is added.
 * Built with shadcn/ui components for a clean and modern look.
 */
export default function StreamingOutputDisplay({
  title = "AI Output",
  description,
  output,
  className,
  placeholder = "Waiting for AI response...",
}: StreamingOutputDisplayProps) {
  // A ref to the viewport element of the ScrollArea.
  // We use this to programmatically control the scroll position.
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  /**
   * This effect handles the auto-scrolling.
   * It runs every time the `output` prop changes.
   */
  useEffect(() => {
    // If the ref is attached to the element...
    if (scrollViewportRef.current) {
      const element = scrollViewportRef.current;
      // ...set its scrollTop to its scrollHeight. This smoothly
      // scrolls the content to the very bottom.
      element.scrollTop = element.scrollHeight;
    }
  }, [output]); // The dependency array ensures this runs only when `output` changes.

  return (
    <Card className={cn("h-[400px] flex flex-col", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        {/* ScrollArea provides the scrollable container. We give it a ref to control it. */}
        <ScrollArea
          className="h-full rounded-md border p-4"
          ref={scrollViewportRef} // Attach the ref to the viewport
        >
          {/* We use a <pre> and <code> tag to preserve whitespace and formatting */}
          {/* which is common in AI/code outputs. */}
          <pre className="text-sm">
            <code className="whitespace-pre-wrap break-words">
              {output || (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </code>
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
