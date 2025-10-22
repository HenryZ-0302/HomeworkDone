interface Resources {
  "commons": {
    "actions": {
      "clear-all": "Clear All",
      "clear-confirmation": "Click again to clear",
      "processing": "Processing...",
      "scan": "Let's Skid",
      "settings": "Settings",
      "title": "Add Images"
    },
    "improve-dialog": {
      "description": "Generate a more detailed solution using the current solution and your prompt.",
      "placeholder": "Make it more detailed...",
      "submit": "Submit",
      "title": "Improve the Solution",
      "toasts": {
        "failed": {
          "description": "Something went wrong: {{error}}",
          "parse": "Failed to parse response, see the developer tools for more details.",
          "title": "Failed to improve your solution"
        },
        "no-key": {
          "description": "Please set an API key for {{provider}} in Settings to continue.",
          "title": "You're almost there"
        },
        "no-source": {
          "description": "Enable at least one AI provider in Settings before improving a solution.",
          "title": "No AI sources"
        },
        "processing": {
          "description": "Improving your solution with AI...Please wait for a while...",
          "title": "Processing"
        }
      },
      "trigger": "Improve the Solution"
    },
    "init-page": {
      "features": {
        "camera": "Snap homework and get step-by-step help.",
        "setup": "Fast setup — paste your Gemini API key and go.",
        "telemetry": "No telemetry or spammy calls. Just the Gemini API."
      },
      "footer": {
        "notice": "Licensed under GPLv3, created by cubewhy.",
        "source": "Source Code"
      },
      "form": {
        "advanced": {
          "base-url-helper": "Leave blank to use the default endpoint for {{provider}}.",
          "base-url-label": "API Base URL (optional)",
          "base-url-placeholder": "Default endpoint for {{provider}}",
          "title": "Advanced"
        },
        "api-hint": "Get an API key at <link>Google AI Studio</link>.",
        "api-hint-openai": "Get an API key at <link>OpenAI Dashboard</link>.",
        "key-placeholder": "{{provider}} API Key",
        "provider": {
          "label": "AI provider"
        },
        "storage-note": "We store your key locally using encrypted browser storage and never send it to our servers.",
        "submit": "Get My Time Back!"
      },
      "headline": {
        "highlight": "Welcome to SkidHomework",
        "subtitle": "Escape the homework grind."
      },
      "intro": "Prefer Khan Academy–style self-study but still get stuck with endless assignments? SkidHomework runs locally, respects your privacy, and helps you focus on learning instead of busywork.",
      "preview": {
        "hints": "Hints",
        "ocr": "OCR",
        "steps": "Steps",
        "title": "Homework Camera"
      },
      "tagline": "Local • Private • Free"
    },
    "preview": {
      "drag-tip": "You can drag your files to this panel.",
      "drag-tip-mobile": "Tap a card to zoom in. Swipe left or right to review everything.",
      "drop-cancel": "Drag here to cancel",
      "file-type": {
        "pdf": "PDF",
        "unknown": "Unknown type"
      },
      "image-alt": "Homework preview",
      "no-files": "No files yet. Upload or take a photo to begin.",
      "remove-aria": "Remove image",
      "title": "Preview"
    },
    "problem-list": {
      "item-label": "Problem {{index}}"
    },
    "scan-page": {
      "donate-btn": "Donate now",
      "errors": {
        "missing-key": "Missing API key for {{provider}}.",
        "parsing-failed": "Failed to parse the AI response.",
        "processing-failed": {
          "answer": "Please check the console for errors and try again.",
          "explanation": "{{error}}",
          "problem": "Processing failed after multiple retries."
        }
      },
      "footer": {
        "license": "Licensed under GPL-3.0.",
        "slogan": "Students' lives matter",
        "source": "Source code"
      },
      "mobile": {
        "empty": "Add a photo or PDF to get started.",
        "hint-pdf": "Enable a Gemini source in Settings to allow PDF uploads.",
        "hint-ready": "You're ready to scan. Tap “Let's Skid” when you're set.",
        "status": "{{count}} file ready",
        "status_plural": "{{count}} files ready",
        "tabs": {
          "capture": "Capture",
          "preview": "Review"
        }
      },
      "tip": "We never upload without your action.",
      "title": "Scan your homework",
      "toasts": {
        "all-processed": {
          "description": "There are no pending or failed images to scan.",
          "title": "All images processed"
        },
        "done": {
          "description": "Your homework has been processed.",
          "title": "All done!"
        },
        "error": {
          "description": "Something went wrong during the process. Please check the console.",
          "title": "An unexpected error occurred"
        },
        "no-key": {
          "description": "Please set an API key for {{provider}} in Settings.",
          "title": "You're almost there"
        },
        "no-model": {
          "description": "Please choose a model for {{provider}} in Settings before scanning.",
          "title": "Model required"
        },
        "no-source": {
          "description": "Enable at least one AI provider with an API key in Settings before scanning.",
          "title": "No AI sources configured"
        },
        "pdf-blocked": {
          "description": "Enable a Gemini source to process PDF files.",
          "title": "PDF uploads disabled"
        },
        "working": {
          "description": "Sending {{count}} file(s) to your AI sources...",
          "title": "Working..."
        }
      }
    },
    "settings-page": {
      "advanced": {
        "custom-base-url": {
          "helper": "Leave blank to use the default endpoint for {{provider}}.",
          "placeholder": "https://example.com/v1",
          "title": "Custom API base URL"
        },
        "desc": "Extras that affect uploads and the interface.",
        "image-post-processing": {
          "binarizing": "Enable binarizing",
          "title": "Image Post-processing"
        },
        "title": "Advanced Settings",
        "ui": {
          "show-donate-btn": "Show donate button",
          "title": "UI"
        }
      },
      "api-credentials": {
        "applied": "API key saved.",
        "desc": "Store API keys locally for each AI provider. They never leave your browser.",
        "label": "API Key",
        "name": {
          "label": "Source name",
          "placeholder": "Friendly name shown in the app"
        },
        "placeholder": "Enter your {{provider}} API key",
        "title": "API Credentials"
      },
      "appearance": {
        "desc": "Choose how SkidHomework looks and which language it uses.",
        "language": {
          "desc": "Switch the interface language.",
          "label": "Language",
          "options": {
            "en": "English",
            "zh": "中文"
          }
        },
        "theme": {
          "desc": "Use the system preference or pick a fixed mode.",
          "label": "Theme",
          "options": {
            "dark": "Dark",
            "light": "Light",
            "system": "System"
          }
        },
        "title": "Appearance & Language"
      },
      "back": "Back",
      "clear-input": "Clear",
      "heading": "SkidHomework Settings",
      "model": {
        "desc": "Choose or type the model name used for requests.",
        "fetch": {
          "error": "Failed to fetch models for {{provider}}. Check your API key or base URL."
        },
        "manual": {
          "desc": "Enter a model name manually if it is not listed.",
          "placeholder": "Model identifier",
          "title": "Custom model"
        },
        "refresh": "Refresh models",
        "sel": {
          "empty": "No models found.",
          "none": "No model selected",
          "search": "Search model...",
          "unknown": "Unknown model ({{name}})"
        },
        "title": "Model Configuration"
      },
      "openai": {
        "poll-interval": {
          "desc": "How long to wait between response status checks.",
          "title": "Polling interval (ms)"
        },
        "poll-timeout": {
          "desc": "Maximum time to wait for a response before failing.",
          "title": "Polling timeout (ms)"
        }
      },
      "reset": "Reset",
      "sources": {
        "active": {
          "badge": "Active",
          "label": "Active source"
        },
        "add": {
          "cancel": "Cancel",
          "confirm": "Add source",
          "label": "Add AI source",
          "name": "Display name (optional)",
          "name-placeholder": "e.g. Classroom Gemini",
          "provider": "Provider",
          "success": "Added {{name}}.",
          "title": "Add AI source"
        },
        "desc": "Manage enabled AI providers and choose which one to configure.",
        "enabled": {
          "label": "Enabled sources",
          "toggle": "Enabled"
        },
        "make-active": "Set active",
        "option": "{{name}} • {{provider}}",
        "providers": {
          "gemini": "Gemini",
          "openai": "OpenAI"
        },
        "remove": {
          "error": "Keep at least one AI source.",
          "label": "Remove source",
          "success": "Removed {{name}}."
        },
        "title": "AI Sources"
      },
      "thinking": {
        "budget": "Thinking budget",
        "desc": "Adjust advanced thinking parameters for supported providers.",
        "title": "Thinking Settings",
        "tokens-unit": "tokens"
      },
      "traits": {
        "desc": "Define the assistant's persona or extra instructions.",
        "placeholder": "e.g., You are a helpful assistant that speaks in a friendly and professional tone.",
        "title": "System Prompt (Traits)"
      }
    },
    "solution-viewer": {
      "answer": "Answer",
      "copy": {
        "button": "Copy answer",
        "failed": {
          "description": "Please copy manually.",
          "title": "Copy failed"
        },
        "success": {
          "description": "Answer copied to clipboard.",
          "title": "Copied"
        }
      },
      "explanation": "Explanation",
      "navigation": {
        "next-image": "Image ⟶",
        "next-problem": "Next",
        "prev-image": "⟵ Image",
        "prev-problem": "Prev"
      },
      "open-preview": "open preview",
      "progress": {
        "prefix": "Problem",
        "suffix": "of {{total}}"
      },
      "source-image": "Source image:"
    },
    "solutions": {
      "analyzing": "Analyzing... extracting problems and solutions from your images.",
      "focus-region-aria": "Solutions keyboard focus region (Tab/Shift+Tab for problems, Space/Shift+Space for images)",
      "idle": "No solutions yet. Add images and click \"Let's Skid\" to see results here.",
      "photo-label": "Photo {{index}} • {{source}}",
      "status": {
        "failed": "Failed to process this image. Please try again.",
        "pending": "Processing in progress...",
        "stream": "Reasoning...",
        "success": "No problems were detected for this image.",
        "success-with-provider": "Solved by {{provider}}."
      },
      "streaming": {
        "placeholder": "AI is thinking...",
        "title": "AI Output"
      },
      "tabs": {
        "fallback": "File {{index}}"
      },
      "title": "Solutions",
      "toggle-preview": "Toggle Preview"
    },
    "sources": {
      "camera": "Camera",
      "upload": "Upload"
    },
    "upload-area": {
      "camera-help-aria": "Camera help",
      "camera-tip": {
        "close": "Got it",
        "intro": "The <takePhoto>Take Photo</takePhoto> button uses the browser's native camera picker (<capture>capture=\"environment\"</capture>). On phones, it opens the camera directly. On desktops, it usually falls back to the file chooser.",
        "tips": ["Prefer natural light and avoid glare.", "Fill the frame with the problem. Keep text sharp.", "One question per shot yields better recognition."],
        "title": "Taking photos on different devices"
      },
      "pdf-disabled": "PDF uploads are available only when a Gemini source is enabled.",
      "take-photo": "Take Photo",
      "upload": "Upload Files",
      "upload-tip": "Images are supported. PDFs require an active Gemini source."
    },
    "uploads-info": {
      "selected": "Selected"
    }
  }
}

export default Resources;
