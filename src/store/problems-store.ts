import { create } from "zustand";

// Type definition for an image item in the upload list.
export type FileItem = {
  id: string; // Unique identifier for each item
  file: File; // The actual image file
  mimeType: string;
  url: string; // Object URL for client-side preview
  source: "upload" | "camera"; // Origin of the image
  status: "success" | "pending" | "failed";
};

// Type definition for the solution set of a single image.
export type Solution = {
  imageUrl: string; // URL of the source image, used as a key
  success: boolean; // Whether the AI processing was successful
  problems: ProblemSolution[]; // Array of problems found in the image
};

export type ProblemSolution = {
  problem: string;
  answer: string;
  explanation: string;
};

// The new interface for our store's state and actions.
export interface ProblemsState {
  // --- STATE ---
  imageItems: FileItem[];
  imageSolutions: Solution[];
  selectedImage?: string;
  selectedProblem: number;
  isWorking: boolean;

  // --- ACTIONS ---

  // Actions for managing image items
  addFileItems: (items: FileItem[]) => void;
  updateItemStatus: (id: string, status: FileItem["status"]) => void;
  removeImageItem: (id: string) => void;
  updateProblem: (
    imageUrl: string,
    problemIndex: number,
    newAnswer: string,
    newExplanation: string,
  ) => void;
  clearAllItems: () => void;

  // Actions for managing image solutions
  addSolution: (solution: Solution) => void;
  removeSolutionsByUrls: (urls: Set<string>) => void;
  clearAllSolutions: () => void;

  // Actions for managing selection state
  setSelectedImage: (image?: string) => void;
  setSelectedProblem: (index: number) => void;

  // Actions to update is working
  setWorking: (isWorking: boolean) => void;
}

export const useProblemsStore = create<ProblemsState>((set) => ({
  // --- INITIAL STATE ---
  imageItems: [],
  imageSolutions: [],
  selectedImage: undefined,
  selectedProblem: 0,
  isWorking: false,

  // --- ACTION IMPLEMENTATIONS ---

  /**
   * Adds new image items to the list.
   * This uses the functional form of `set` to prevent race conditions
   * when adding items from multiple sources.
   */
  addFileItems: (newItems) =>
    set((state) => ({ imageItems: [...state.imageItems, ...newItems] })),

  /**
   * Updates the status of a specific image item.
   * This is concurrency-safe because it operates on the latest state.
   */
  updateItemStatus: (id, status) =>
    set((state) => ({
      imageItems: state.imageItems.map((item) =>
        item.id === id ? { ...item, status } : item,
      ),
    })),

  /**
   * Removes a single image item by its ID.
   */
  removeImageItem: (id) =>
    set((state) => ({
      imageItems: state.imageItems.filter((item) => item.id !== id),
    })),

  updateProblem: (
    imageUrl: string,
    problemIndex: number,
    newAnswer: string,
    newExplanation: string,
  ) =>
    set((state) => ({
      imageSolutions: state.imageSolutions.map((solution) => {
        if (solution.imageUrl === imageUrl) {
          const updatedProblems = [...solution.problems];

          updatedProblems[problemIndex] = {
            ...updatedProblems[problemIndex],
            answer: newAnswer,
            explanation: newExplanation,
          };

          return { ...solution, problems: updatedProblems };
        }
        return solution;
      }),
    })),

  /**
   * Clears all image items from the state.
   */
  clearAllItems: () => set({ imageItems: [] }),

  /**
   * Adds a new image solution to the list.
   * This is the core fix for the concurrency issue. By appending to the previous state
   * within the `set` function, we ensure no solution overwrites another.
   */
  addSolution: (newSolution) =>
    set((state) => ({
      imageSolutions: [...state.imageSolutions, newSolution],
    })),

  /**
   * Removes solutions associated with a given set of image URLs.
   * Useful for reprocessing failed items without creating duplicates.
   */
  removeSolutionsByUrls: (urlsToRemove) =>
    set((state) => ({
      imageSolutions: state.imageSolutions.filter(
        (sol) => !urlsToRemove.has(sol.imageUrl),
      ),
    })),

  /**
   * Clears all solutions from the state.
   */
  clearAllSolutions: () => set({ imageSolutions: [] }),

  // Simple setters for selection state
  setSelectedImage: (selectedImage) => set({ selectedImage }),
  setSelectedProblem: (selectedProblem) => set({ selectedProblem }),

  setWorking: (isWorking) => set({ isWorking }),
}));
