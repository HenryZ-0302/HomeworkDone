import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  MessageSquare,
  Plus,
  Trash2,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { cn } from "@/lib/utils";
import { MemoizedMarkdown } from "../MarkdownRenderer";
import { useAiStore, type AiSource } from "@/store/ai-store";
import { useChatStore } from "@/store/chat-store";
import type { AiChatMessage } from "@/ai/chat-types";

const BASE_CHAT_SYSTEM_PROMPT =
  "You are a helpful AI tutor. Provide clear, encouraging explanations and show your reasoning when helpful.";

function trimTitle(text: string, fallback: string) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return fallback;
  return trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
}

function mapMessagesToAi(
  messages: {
    role: "user" | "assistant" | "system";
    content: string;
  }[],
): AiChatMessage[] {
  return messages
    .filter((msg) => msg.content && msg.content.trim().length > 0)
    .map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
}

type SeedChatState = {
  title?: string;
  prefillMessage?: string;
  contextMessage?: string;
  sourceId?: string;
  model?: string;
};

export default function ChatPage() {
  const { t } = useTranslation("commons", { keyPrefix: "chat-page" });
  const navigate = useNavigate();
  const location = useLocation();
  const translate = (key: string, options?: Record<string, unknown>) =>
    t(key as never, options as never) as unknown as string;

  const sources = useAiStore((state) => state.sources);
  const activeSourceId = useAiStore((state) => state.activeSourceId);
  const setActiveSource = useAiStore((state) => state.setActiveSource);
  const getClientForSource = useAiStore((state) => state.getClientForSource);

  const threads = useChatStore((state) => state.threads);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const isHydrated = useChatStore((state) => state.isHydrated);
  const loadThreads = useChatStore((state) => state.loadThreads);
  const loadMessages = useChatStore((state) => state.loadMessages);
  const createChat = useChatStore((state) => state.createChat);
  const appendMessage = useChatStore((state) => state.appendMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const updateThread = useChatStore((state) => state.updateThread);
  const deleteChat = useChatStore((state) => state.deleteChat);

  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [seedData, setSeedData] = useState<SeedChatState | null>(null);

  const storeChatMessages = useChatStore((state) => {
    const id = state.activeChatId;
    return id ? state.messages[id] : undefined;
  });
  const chatMessages = storeChatMessages ?? [];

  useEffect(() => {
    if (!isHydrated) {
      loadThreads().catch((error) => {
        console.error("Failed to load chat threads", error);
      });
    }
  }, [isHydrated, loadThreads]);

  useEffect(() => {
    if (!activeChatId) return;
    const state = useChatStore.getState();
    if (state.messages[activeChatId]) return;
    loadMessages(activeChatId).catch((error) => {
      console.error("Failed to load chat messages", error);
    });
  }, [activeChatId, loadMessages]);

  const availableSources = useMemo(
    () => sources.filter((source) => source.enabled && Boolean(source.apiKey)),
    [sources],
  );

  const sourceMap = useMemo(
    () =>
      new Map<string, AiSource>(sources.map((source) => [source.id, source])),
    [sources],
  );

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeChatId),
    [threads, activeChatId],
  );

  const [currentSourceId, setCurrentSourceId] = useState<string | null>(null);
  const [sourcePopoverOpen, setSourcePopoverOpen] = useState(false);

  useEffect(() => {
    if (activeThread) {
      setCurrentSourceId(activeThread.sourceId);
      return;
    }
    if (currentSourceId) return;
    const preferred =
      availableSources.find((src) => src.id === activeSourceId) ??
      availableSources[0] ??
      null;
    if (preferred) {
      setCurrentSourceId(preferred.id);
    }
  }, [activeThread, availableSources, activeSourceId, currentSourceId]);

  const resolvedSourceId = activeThread?.sourceId ?? currentSourceId ?? null;
  const resolvedSource = resolvedSourceId
    ? (sourceMap.get(resolvedSourceId) ?? null)
    : null;
  const resolvedAvailableSource = resolvedSourceId
    ? (availableSources.find((src) => src.id === resolvedSourceId) ?? null)
    : null;

  const [modelInput, setModelInput] = useState("");

  useEffect(() => {
    const state = location.state as { seedChat?: SeedChatState } | undefined;
    if (!state?.seedChat) return;

    const seed = state.seedChat;
    setSeedData(seed);
    if (seed.prefillMessage) {
      setMessageInput(seed.prefillMessage);
    }
    if (seed.sourceId) {
      setCurrentSourceId(seed.sourceId);
    }
    if (seed.model) {
      setModelInput(seed.model);
    }

    navigate(location.pathname, { replace: true });
  }, [location, navigate]);

  useEffect(() => {
    if (activeThread) {
      setModelInput(activeThread.model);
    } else if (seedData?.model) {
      setModelInput(seedData.model);
    } else if (resolvedSource) {
      setModelInput(resolvedSource.model);
    } else {
      setModelInput("");
    }
  }, [activeThread, resolvedSource, seedData]);

  const messageContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = messageContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [chatMessages]);

  const handleSelectSource = async (sourceId: string) => {
    setSourcePopoverOpen(false);
    setCurrentSourceId(sourceId);
    setActiveSource(sourceId);

    const source = sourceMap.get(sourceId);
    if (source && !activeThread) {
      setModelInput(source.model);
    }

    if (activeThread) {
      const updates: {
        sourceId: string;
        updatedAt: number;
        model?: string;
      } = {
        sourceId,
        updatedAt: Date.now(),
      };
      if (source) {
        updates.model = source.model;
        setModelInput(source.model);
      }
      await updateThread(activeThread.id, updates);
    }
  };

  const handleModelBlur = async () => {
    const trimmed = modelInput.trim();
    if (!activeThread) return;
    if (trimmed && trimmed !== activeThread.model) {
      await updateThread(activeThread.id, { model: trimmed });
    }
    setModelInput(trimmed);
  };

  const handleSend = async () => {
    const trimmed = messageInput.trim();
    if (!trimmed || isSending) return;

    const seedContext = seedData;

    if (!resolvedSource) {
      toast.error(translate("errors.no-source"));
      return;
    }

    if (!resolvedSource.apiKey) {
      toast.error(
        translate("errors.missing-key", { provider: resolvedSource.name }),
      );
      return;
    }

    const modelName = modelInput.trim() || resolvedSource.model;
    if (!modelName) {
      toast.error(translate("errors.no-model"));
      return;
    }

    setModelInput(modelName);
    setIsSending(true);
    setMessageInput("");

    let chatId: string | null = activeChatId ?? null;
    let assistantMessageId: string | null = null;

    try {
      let newlyCreated = false;

      if (!chatId) {
        const title =
          seedContext?.title ??
          trimTitle(trimmed, translate("history.untitled"));
        const metadata = seedContext?.contextMessage
          ? { contextMessage: seedContext.contextMessage }
          : null;

        chatId = await createChat({
          title,
          sourceId: resolvedSource.id,
          model: modelName,
          metadata,
          initialMessages: [
            {
              role: "user",
              content: trimmed,
            },
          ],
        });
        newlyCreated = true;
        setActiveChat(chatId);
        setSeedData(null);
      } else {
        await appendMessage(chatId, {
          role: "user",
          content: trimmed,
        });
      }

      if (!newlyCreated && chatId) {
        await updateThread(chatId, { updatedAt: Date.now(), model: modelName });
      }

      const assistantMessage = await appendMessage(chatId!, {
        role: "assistant",
        content: "",
      });
      assistantMessageId = assistantMessage.id;

      const currentState = useChatStore.getState();
      const conversation = currentState.messages[chatId!] ?? [];
      const contextMessages: AiChatMessage[] = [];

      if (newlyCreated && seedContext?.contextMessage) {
        contextMessages.push({
          role: "system",
          content: seedContext.contextMessage,
        });
      } else if (activeThread?.metadata) {
        const threadMetadata = activeThread.metadata as {
          contextMessage?: string;
        } | null;
        if (threadMetadata?.contextMessage) {
          contextMessages.push({
            role: "system",
            content: threadMetadata.contextMessage,
          });
        }
      }

      const history = mapMessagesToAi(
        conversation
          .filter((message) => message.id !== assistantMessageId)
          .map((message) => ({
            role: message.role,
            content: message.content,
          })),
      );
      const finalHistory = [...contextMessages, ...history];

      const client = getClientForSource(resolvedSource.id);
      if (!client?.sendChat) {
        throw new Error(translate("errors.unsupported"));
      }

      const traitsPrompt = resolvedSource.traits
        ? `\nUser defined traits:\n<traits>\n${resolvedSource.traits}\n</traits>\n`
        : "";

      client.setSystemPrompt(BASE_CHAT_SYSTEM_PROMPT + traitsPrompt);

      let aggregated = "";
      const updateAssistant = async (text: string) => {
        aggregated = text;
        if (assistantMessageId) {
          await updateMessage(chatId!, assistantMessageId, {
            content: aggregated,
          });
        }
      };

      const finalText = await client.sendChat(
        finalHistory,
        modelName,
        (delta) => {
          aggregated += delta;
          if (!assistantMessageId) return;
          updateMessage(chatId!, assistantMessageId, {
            content: aggregated,
          }).catch((error) => {
            console.error("Failed to update streaming message", error);
          });
        },
      );

      if (finalText.trim().length) {
        await updateAssistant(finalText.trim());
      } else if (aggregated.trim().length) {
        await updateAssistant(aggregated.trim());
      }
    } catch (error) {
      const message = translate("errors.send-failed", { error: String(error) });
      toast.error(message);
      if (chatId && assistantMessageId) {
        await updateMessage(chatId, assistantMessageId, { content: message });
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleNewChat = () => {
    setActiveChat(undefined);
    if (resolvedSource) {
      setModelInput(resolvedSource.model);
    } else {
      setModelInput("");
    }
    setMessageInput("");
    setSeedData(null);
  };

  const handleDeleteChat = async () => {
    if (!activeChatId) return;
    await deleteChat(activeChatId);
  };

  const currentSourceLabel = resolvedSource
    ? resolvedSource.name
    : translate("source.select.placeholder");

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {translate("title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {translate("subtitle")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/")}>
              {translate("actions.back")}
            </Button>
            <Button onClick={handleNewChat} variant="secondary">
              <Plus className="mr-2 h-4 w-4" />
              {translate("actions.new-chat")}
            </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
          <aside className="space-y-4">
            <Card className="border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  {translate("source.section")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Popover
                  open={sourcePopoverOpen}
                  onOpenChange={setSourcePopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={sourcePopoverOpen}
                      className="w-full justify-between"
                      disabled={!availableSources.length}
                    >
                      {currentSourceLabel}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0">
                    <Command>
                      <CommandInput placeholder={translate("source.search")} />
                      <CommandList>
                        <CommandEmpty>{translate("source.empty")}</CommandEmpty>
                        <CommandGroup>
                          {availableSources.map((source) => (
                            <CommandItem
                              key={source.id}
                              onSelect={() => handleSelectSource(source.id)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  source.id === resolvedSourceId
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <span>{source.name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    {translate("source.model")}
                  </label>
                  <Input
                    value={modelInput}
                    onChange={(event) => setModelInput(event.target.value)}
                    onBlur={handleModelBlur}
                    placeholder={translate("source.model-placeholder")}
                    disabled={!resolvedSource}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  {translate("history.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[421px]">
                  <div className="space-y-1 p-2">
                    {threads.length === 0 ? (
                      <div className="px-3 py-6 text-xs text-muted-foreground">
                        {translate("history.empty")}
                      </div>
                    ) : (
                      threads.map((thread) => {
                        const threadSource = sourceMap.get(thread.sourceId);
                        const isActive = thread.id === activeChatId;
                        return (
                          <Button
                            key={thread.id}
                            variant={isActive ? "secondary" : "ghost"}
                            className={cn(
                              "w-full justify-start text-left",
                              "flex items-center gap-3",
                            )}
                            onClick={() => setActiveChat(thread.id)}
                          >
                            <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate text-sm font-medium">
                                {thread.title}
                              </span>
                              <span className="truncate text-xs text-muted-foreground">
                                {threadSource
                                  ? threadSource.name
                                  : translate("history.unknown-source")}
                                {" · "}
                                {thread.model}
                              </span>
                            </div>
                          </Button>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {activeChatId && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleDeleteChat}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {translate("actions.delete-chat")}
              </Button>
            )}
          </aside>

          <main>
            <Card className="border-white/10">
              <CardHeader className="border-b border-white/5 pb-3">
                <CardTitle className="text-base font-semibold">
                  {activeThread
                    ? activeThread.title
                    : translate("conversation.empty-title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex h-[560px] flex-col">
                <div
                  ref={messageContainerRef}
                  className="flex-1 space-y-4 overflow-y-auto pr-2"
                >
                  {chatMessages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      {translate("conversation.empty")}
                    </div>
                  ) : (
                    chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.role === "user"
                            ? "justify-end"
                            : "justify-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-lg px-4 py-3 text-sm shadow-sm",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted",
                          )}
                        >
                          <MemoizedMarkdown source={message.content || "..."} />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <Textarea
                    value={messageInput}
                    onChange={(event) => setMessageInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={translate("composer.placeholder")}
                    disabled={isSending || !resolvedAvailableSource}
                    className="h-28 resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSend}
                      disabled={
                        isSending ||
                        !messageInput.trim() ||
                        !resolvedAvailableSource
                      }
                    >
                      {isSending
                        ? translate("composer.sending")
                        : translate("composer.send")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
