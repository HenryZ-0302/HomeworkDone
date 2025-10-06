import { useProblemsStore } from "@/store/problems-store";
import type { OrderedSolution } from "./areas/SolutionsArea";
import { Button } from "./ui/button";

export type ProblemListProps = {
  entry: OrderedSolution;
};

export default function ProblemList({ entry }: ProblemListProps) {
  const { selectedProblem, setSelectedProblem } = useProblemsStore((s) => s);

  return (
    <aside className="md:col-span-1">
      <ul className="space-y-2">
        {entry.solutions.problems.map((p, i) => (
          <li key={i}>
            <Button
              variant={i === selectedProblem ? "secondary" : "outline"}
              className="w-full justify-start whitespace-normal text-left"
              onClick={() => setSelectedProblem(i)}
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold">Problem {i + 1}</div>
                <div className="truncate text-xs opacity-80">{p.problem}</div>
              </div>
            </Button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
