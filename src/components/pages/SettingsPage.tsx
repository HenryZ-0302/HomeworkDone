import { useGeminiStore } from "@/store/gemini-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useNavigate } from "react-router-dom";
import { useHotkeys } from "react-hotkeys-hook";

export default function SettingsPage() {
  // --- State Management ---
  // Retrieve state and action functions from the Gemini Zustand store.
  // Using selectors (e.g., `(s) => s.geminiKey`) ensures the component only
  // re-renders when the specific piece of state it uses changes.

  // API Key state and actions
  const geminiKey = useGeminiStore((s) => s.geminiKey);
  const setGeminiKey = useGeminiStore((s) => s.setGeminiKey);
  const clearGeminiKey = useGeminiStore((s) => s.clearGeminiKey);
  const hasKey = useGeminiStore((s) => s.hasKey);

  // Custom Base URL state and actions
  const geminiBaseUrl = useGeminiStore((s) => s.geminiBaseUrl);
  const setGeminiBaseUrl = useGeminiStore((s) => s.setGeminiBaseUrl);
  const clearGeminiBaseUrl = useGeminiStore((s) => s.clearGeminiBaseUrl);

  // Model selection state and actions
  const geminiModel = useGeminiStore((s) => s.geminiModel);
  const setGeminiModel = useGeminiStore((s) => s.setGeminiModel);

  // AI traits (system prompt) state and actions
  const traits = useGeminiStore((s) => s.traits);
  const setTraits = useGeminiStore((s) => s.setTraits);
  const clearTraits = useGeminiStore((s) => s.clearTraits);

  // TODO: allow customize thinking budget
  // const thinkingBudget = useGeminiStore((s) => s.thinkingBudget);
  // const setThinkBudget = useGeminiStore((s) => s.setThinkingBudget);

  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/");
  };

  useHotkeys("esc", handleBack);

  // --- Render Logic ---
  return (
    // Main container for the settings page with padding and max-width for better layout.
    <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gemini Settings</h1>
        <p className="text-muted-foreground">
          Configure your connection to the Gemini API.
        </p>
      </div>

      <Button className="w-full" onClick={handleBack}>
        Back
      </Button>
      {/* Card for API Credentials */}
      <Card>
        <CardHeader>
          <CardTitle>API Credentials</CardTitle>
          <CardDescription>
            Enter your Google AI Studio API key to connect to Gemini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gemini-key">Gemini API Key</Label>
            <div className="flex items-center space-x-2">
              {/* Input for the API key. type="password" obscures the value. */}
              <Input
                id="gemini-key"
                type="password"
                placeholder="Enter your API key here"
                // Use `geminiKey || ''` to ensure the input is always a controlled component.
                value={geminiKey || ""}
                onChange={(e) => setGeminiKey(e.target.value)}
              />
              {/* Button to clear the API key, disabled if no key is present. */}
              <Button
                variant="outline"
                onClick={clearGeminiKey}
                disabled={!hasKey()}
              >
                Clear
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {hasKey()
                ? "Your API key is set and stored securely."
                : "Your API key is not set."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card for Model Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Model Configuration</CardTitle>
          <CardDescription>
            Choose the model and define the AI's behavior.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Model Selection Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="gemini-model">Model</Label>
            <Input
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
            />
          </div>

          {/* AI Traits / System Prompt Textarea */}
          <div className="space-y-2">
            <Label htmlFor="gemini-traits">System Prompt (Traits)</Label>
            <div className="relative">
              <Textarea
                id="gemini-traits"
                placeholder="e.g., You are a helpful assistant that speaks in a friendly and professional tone."
                // Use `traits || ''` to handle the optional string value.
                value={traits || ""}
                onChange={(e) => setTraits(e.target.value)}
                className="min-h-[100px] pr-20" // Add padding to the right for the clear button
              />
              {/* Position the clear button inside the textarea for a cleaner look. */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2"
                onClick={clearTraits}
                disabled={!traits}
              >
                Clear
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Define the AI's personality, role, or instructions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card for Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
          <CardDescription>
            Optionally provide a custom base URL for API requests (e.g., for a
            proxy).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="base-url">Custom Base URL</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="base-url"
                type="text"
                placeholder="https://generativelanguage.googleapis.com"
                value={geminiBaseUrl || ""}
                onChange={(e) => setGeminiBaseUrl(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={clearGeminiBaseUrl}
                disabled={!geminiBaseUrl}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Button className="w-full" onClick={handleBack}>
        Back
      </Button>
    </div>
  );
}
