import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ChevronsUpDown,
  Check,
  Menu,
  GitFork,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Checkbox } from "../ui/checkbox";

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
  const translate = useCallback(
    (key: string, options?: Record<string, unknown>) =>
      t(key as never, options as never) as unknown as string,
    [t],
  );

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
  const clearAllChats = useChatStore((state) => state.clearAllChats);

  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [seedData, setSeedData] = useState<SeedChatState | null>(null);

  const storeChatMessages = useChatStore((state) => {
    const id = state.activeChatId;
    return id ? state.messages[id] : undefined;
  });

  const chatMessages = useMemo(
    () => storeChatMessages ?? [],
    [storeChatMessages],
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("history");
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [forkingChatId, setForkingChatId] = useState<string | null>(null);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);

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

  const toggleChatSelection = useCallback((chatId: string) => {
    setSelectedChatIds((prev) => {
      const next = new Set(prev);
      if (next.has(chatId)) {
        next.delete(chatId);
      } else {
        next.add(chatId);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedChatIds(() => new Set());
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedChatIds((prev) => {
      if (threads.length === 0) {
        return new Set();
      }
      if (prev.size === threads.length) {
        return new Set();
      }
      return new Set(threads.map((thread) => thread.id));
    });
  }, [threads]);

  const selectedCount = selectedChatIds.size;
  const isAllSelected = threads.length > 0 && selectedCount === threads.length;
  const hasSelection = selectedCount > 0;

  const handleBulkDeleteSelected = async () => {
    if (!selectedCount) return;
    const confirmDelete = window.confirm(
      translate("history.bulk-delete-confirm", {
        defaultValue: "Delete the selected chats? This cannot be undone.",
      }),
    );
    if (!confirmDelete) return;

    setIsBulkDeleting(true);
    try {
      const ids = Array.from(selectedChatIds);
      for (const id of ids) {
        await deleteChat(id);
      }
      toast.success(
        translate("history.bulk-delete-success", {
          defaultValue: "Selected chats deleted successfully.",
        }),
      );
    } catch (error) {
      console.error("Failed to delete selected chats", error);
      toast.error(
        translate("history.bulk-delete-error", {
          defaultValue: "Failed to delete selected chats.",
        }),
      );
    } finally {
      setIsBulkDeleting(false);
      clearSelection();
    }
  };

  const handleClearAllChats = async () => {
    if (!threads.length) return;
    const confirmDelete = window.confirm(
      translate("history.clear-all-confirm", {
        defaultValue: "Clear all chat history? This cannot be undone.",
      }),
    );
    if (!confirmDelete) return;

    setIsBulkDeleting(true);
    try {
      await clearAllChats();
      toast.success(
        translate("history.clear-all-success", {
          defaultValue: "All chats have been cleared.",
        }),
      );
    } catch (error) {
      console.error("Failed to clear all chats", error);
      toast.error(
        translate("history.clear-all-error", {
          defaultValue: "Failed to clear all chats. Try again.",
        }),
      );
    } finally {
      setIsBulkDeleting(false);
      clearSelection();
    }
  };

  const handleForkChat = async (chatId: string) => {
    const thread = threads.find((item) => item.id === chatId);
    if (!thread) return;

    setForkingChatId(chatId);
    try {
      const storeState = useChatStore.getState();
      let existingMessages = storeState.messages[chatId];
      if (!existingMessages) {
        existingMessages = await storeState.loadMessages(chatId);
      }

      const forkTitle = trimTitle(
        `${thread.title} (Copy)`,
        t("history.untitled"),
      );

      const newChatId = await createChat({
        title: forkTitle,
        sourceId: thread.sourceId,
        model: thread.model,
        metadata: thread.metadata ?? undefined,
        initialMessages: existingMessages.map((message) => ({
          role: message.role,
          content: message.content,
          createdAt: message.createdAt,
        })),
      });

      setActiveChat(newChatId);
      setCurrentSourceId(thread.sourceId);
      toast.success(
        translate("history.fork-success", {
          defaultValue: "Chat duplicated successfully.",
        }),
      );
      setSidebarOpen(false);
    } catch (error) {
      console.error("Failed to fork chat", error);
      toast.error(
        translate("history.fork-error", {
          defaultValue: "Unable to fork chat right now.",
        }),
      );
    } finally {
      setForkingChatId(null);
    }
  };

  const handleDeleteSingleChat = async (chatId: string) => {
    const thread = threads.find((item) => item.id === chatId);
    if (!thread) return;
    const confirmDelete = window.confirm(
      translate("history.delete-confirm", {
        defaultValue: "Delete this chat? This cannot be undone.",
        title: thread.title,
      }),
    );
    if (!confirmDelete) return;

    setDeletingChatId(chatId);
    try {
      await deleteChat(chatId);
      toast.success(
        translate("history.delete-success", {
          defaultValue: "Chat deleted successfully.",
        }),
      );
      setSelectedChatIds((prev) => {
        if (!prev.has(chatId)) return prev;
        const next = new Set(prev);
        next.delete(chatId);
        return next;
      });
    } catch (error) {
      console.error("Failed to delete chat", error);
      toast.error(
        translate("history.delete-error", {
          defaultValue: "Failed to delete chat.",
        }),
      );
    } finally {
      setDeletingChatId(null);
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
      toast.error(t("errors.no-source"));
      return;
    }

    if (!resolvedSource.apiKey) {
      toast.error(t("errors.missing-key", { provider: resolvedSource.name }));
      return;
    }

    const modelName = modelInput.trim() || resolvedSource.model;
    if (!modelName) {
      toast.error(t("errors.no-model"));
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
          seedContext?.title ?? trimTitle(trimmed, t("history.untitled"));
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
        throw new Error(t("errors.unsupported"));
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
      const message = t("errors.send-failed", { error: String(error) });
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
    clearSelection();
  };

  const currentSourceLabel = resolvedSource
    ? resolvedSource.name
    : t("source.select.placeholder");

  const activeThreadModel = activeThread?.model?.trim();
  const currentModelInput = modelInput.trim();
  const activeModelName =
    activeThreadModel || currentModelInput || resolvedSource?.model || "";

  const sidebarContent = (
    <div className="flex h-full flex-col gap-4">
      <Tabs
        value={sidebarTab}
        onValueChange={setSidebarTab}
        className="flex h-full flex-col gap-4"
      >
        <TabsList className="w-full">
          <TabsTrigger value="history">{t("history.title")}</TabsTrigger>
          <TabsTrigger value="sources">{t("source.section")}</TabsTrigger>
        </TabsList>
        <TabsContent
          value="history"
          className="flex flex-1 flex-col gap-3 overflow-hidden"
        >
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={!threads.length}
            >
              {isAllSelected
                ? translate("history.selection.clear", {
                    defaultValue: "Clear selection",
                  })
                : translate("history.selection.all", {
                    defaultValue: "Select all",
                  })}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              disabled={!hasSelection}
            >
              {translate("history.selection.reset", {
                defaultValue: "Reset selection",
              })}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDeleteSelected}
              disabled={!hasSelection || isBulkDeleting}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              {isBulkDeleting
                ? translate("history.deleting", { defaultValue: "Deleting..." })
                : translate("history.delete-selected", {
                    defaultValue: "Delete selected",
                  })}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAllChats}
              disabled={!threads.length || isBulkDeleting}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              {translate("history.clear-all", { defaultValue: "Clear all" })}
            </Button>
          </div>
          <div className="flex-1 overflow-hidden rounded-lg border border-border/40 bg-background/40">
            <div className="h-full space-y-2 overflow-y-auto px-2 py-3">
              {threads.length === 0 ? (
                <div className="rounded-md border border-dashed border-white/10 px-3 py-6 text-center text-xs text-muted-foreground">
                  {t("history.empty")}
                </div>
              ) : (
                threads.map((thread) => {
                  const threadSource = sourceMap.get(thread.sourceId);
                  const isActive = thread.id === activeChatId;
                  const isSelected = selectedChatIds.has(thread.id);
                  return (
                    <div
                      key={thread.id}
                      className={cn(
                        "flex items-center gap-2 rounded-md border p-2 transition-colors",
                        isActive
                          ? "border-primary bg-primary/10"
                          : "border-transparent bg-muted/30 hover:border-border/60 hover:bg-muted/50",
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleChatSelection(thread.id)}
                        onClick={(event) => event.stopPropagation()}
                        aria-label={translate("history.selection.label", {
                          defaultValue: "Select chat",
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setActiveChat(thread.id);
                          setSidebarOpen(false);
                        }}
                        className="flex flex-1 flex-col text-left"
                      >
                        <span className="truncate text-sm font-medium">
                          {thread.title}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {threadSource
                            ? threadSource.name
                            : t("history.unknown-source")}
                          {" · "}
                          {thread.model}
                        </span>
                      </button>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleForkChat(thread.id);
                          }}
                          disabled={forkingChatId === thread.id}
                          aria-label={translate("history.actions.fork", {
                            defaultValue: "Fork chat",
                          })}
                        >
                          <GitFork className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteSingleChat(thread.id);
                          }}
                          disabled={deletingChatId === thread.id}
                          aria-label={translate("history.actions.delete", {
                            defaultValue: "Delete chat",
                          })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent
          value="sources"
          className="flex flex-1 flex-col gap-4 overflow-y-auto"
        >
          <div className="space-y-3 rounded-lg border border-white/10 bg-background/40 p-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("source.section")}
            </label>
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
                  <CommandInput placeholder={t("source.search")} />
                  <CommandList>
                    <CommandEmpty>{t("source.empty")}</CommandEmpty>
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
                {t("source.model")}
              </label>
              <Input
                value={modelInput}
                onChange={(event) => setModelInput(event.target.value)}
                onBlur={handleModelBlur}
                placeholder={t("source.model-placeholder")}
                disabled={!resolvedSource}
              />
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-background/40 p-4 text-xs text-muted-foreground">
            {translate("source.model-helper", {
              defaultValue:
                "Pick a provider and optionally override the default model.",
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-3 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label={translate("sidebar.open", {
                defaultValue: "Open chat menu",
              })}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                {t("title")}
              </h1>
              <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              {t("actions.back")}
            </Button>
            <Button
              size="sm"
              onClick={handleNewChat}
              variant="secondary"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>{t("actions.new-chat")}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-3 py-4 sm:px-6 sm:py-6 lg:flex-row lg:gap-8 lg:px-8">
        <aside className="hidden w-full flex-[0.5] lg:flex lg:flex-col">
          <div className="sticky top-[96px] flex h-[calc(100vh-160px)] flex-1 flex-col rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm">
            {sidebarContent}
          </div>
        </aside>

        <main className="flex flex-1 flex-col">
          <section className="flex h-full min-h-[480px] flex-1 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold sm:text-xl">
                  {activeThread
                    ? activeThread.title
                    : t("conversation.empty-title")}
                </h2>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {resolvedSource
                    ? `${resolvedSource.name}${
                        activeModelName ? ` · ${activeModelName}` : ""
                      }`
                    : t("source.select.placeholder")}
                </p>
              </div>
            </div>

            <div
              ref={messageContainerRef}
              className="flex-1 space-y-4 overflow-y-auto px-4 pb-5 pt-6 sm:px-6"
            >
              {chatMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  {t("conversation.empty")}
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[72%]",
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

            <div className="border-t border-border/60 bg-background/40 px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <Textarea
                  value={messageInput}
                  onChange={(event) => setMessageInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={t("composer.placeholder")}
                  disabled={isSending || !resolvedAvailableSource}
                  className="min-h-[96px] w-full flex-1 resize-none rounded-xl border border-border/60 bg-background/70 p-3 text-sm shadow-sm sm:min-h-[120px]"
                />
                <Button
                  onClick={handleSend}
                  disabled={
                    isSending ||
                    !messageInput.trim() ||
                    !resolvedAvailableSource
                  }
                  className="h-12 w-full rounded-xl sm:h-[52px] sm:w-auto sm:px-6"
                >
                  {isSending ? t("composer.sending") : t("composer.send")}
                </Button>
              </div>
            </div>
          </section>
        </main>
      </div>

      <Dialog open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl p-4 sm:max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-2">
            <DialogTitle className="text-base font-semibold leading-none tracking-tight">
              {translate("sidebar.mobile-title", { defaultValue: "Chat menu" })}
            </DialogTitle>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto pt-4">{sidebarContent}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
