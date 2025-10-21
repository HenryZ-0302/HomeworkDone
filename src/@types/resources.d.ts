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
          "description": "You need to set your API key in settings to use the AI.",
          "title": "You're almost there"
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
          "base-url-helper": "Leave blank to use the default Google API endpoint.",
          "base-url-label": "Gemini API Base URL (optional)",
          "base-url-placeholder": "https://generativelanguage.googleapis.com",
          "title": "Advanced"
        },
        "api-hint": "Get an API key at <link>Google AI Studio</link>.",
        "key-placeholder": "Gemini API Key",
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
          "description": "Please set a Gemini API key before you scan your homework.",
          "title": "You're almost there"
        },
        "no-model": {
          "description": "Please specify a Gemini model in settings to start skidding!",
          "title": "You're almost there"
        },
        "working": {
          "description_one": "Sending {{count}} file to Gemini... Your time is being saved...",
          "description_other": "Sending {{count}} files to Gemini... Your time is being saved...",
          "title": "Working..."
        }
      }
    },
    "settings-page": {
      "advanced": {
        "custom-base-url": {
          "placeholder": "https://generativelanguage.googleapis.com",
          "title": "Custom Gemini API base URL"
        },
        "desc": "Please make sure you know what you are doing.",
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
        "desc": "Enter your Google AI Studio API key to connect to Gemini.",
        "label": "Gemini API Key",
        "placeholder": "Enter your API key here",
        "status": {
          "set": "Your API key is set and stored securely.",
          "unset": "Your API key is not set."
        },
        "title": "API Credentials"
      },
      "back": "Back",
      "clear-input": "Clear",
      "heading": "SkidHomework Settings",
      "model": {
        "desc": "Choose the model and define the AI's behavior.",
        "sel": {
          "empty": "Select a model...",
          "no-model-available": "No available models",
          "search-placeholder": "Search model...",
          "title": "Model",
          "unknown": "Unknown model ({{name, string}})"
        },
        "title": "Model Configuration"
      },
      "thinking": {
        "default": "Default: 8192 Tokens",
        "title": "Thinking Budget",
        "tokens-unit": "Tokens"
      },
      "traits": {
        "desc": "Define the AI's personality, role, or instructions",
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
        "success": "No problems were detected for this image."
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
      "take-photo": "Take Photo",
      "upload": "Upload Files",
      "upload-tip": "PDF and image files are supported"
    },
    "uploads-info": {
      "selected": "Selected"
    }
  }
}

export default Resources;
