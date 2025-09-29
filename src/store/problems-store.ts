import { create } from "zustand";

// Type definition for an image item in the upload list.
export type ImageItem = {
  id: string; // Unique identifier for each item
  file: File; // The actual image file
  url: string; // Object URL for client-side preview
  source: "upload" | "camera"; // Origin of the image
  // Requirement 1: Status for visual feedback (e.g., colored borders).
  status: "success" | "pending" | "failed";
};

// Type definition for the solution set of a single image.
export type ImageSolution = {
  imageUrl: string; // URL of the source image, used as a key
  success: boolean; // Whether the AI processing was successful
  problems: ProblemSolution[]; // Array of problems found in the image
};

// Type definition for a single problem's solution.
export type ProblemSolution = {
  problem: string;
  answer: string;
  explanation: string;
};

export interface ProblemsState {
  imageItems: ImageItem[];
  setImageItems: (imageItems: ImageItem[]) => void;

  imageSolutions: ImageSolution[];
  setImageSolutions: (imageSolutions: ImageSolution[]) => void;

  selectedImage?: string;
  setSelectedImage: (image?: string) => void;
  clearSelectedImage: () => void;

  selectedProblem: number;
  setSelectedProblem: (index: number) => void;
}

export const useProblemsStore = create<ProblemsState>((set) => ({
  imageItems: [],
  setImageItems: (imageItems) => set({ imageItems }),

  imageSolutions: [],
  setImageSolutions: (imageSolutions) => set({ imageSolutions }),

  selectedImage: undefined,
  setSelectedImage: (selectedImage) => set({ selectedImage }),
  clearSelectedImage: () => set({ selectedImage: undefined }),

  selectedProblem: 0,
  setSelectedProblem: (selectedProblem) => set({ selectedProblem }),
}));
