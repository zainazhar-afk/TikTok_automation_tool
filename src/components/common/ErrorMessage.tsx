import { AlertTriangle } from "lucide-react";

export function ErrorMessage({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
