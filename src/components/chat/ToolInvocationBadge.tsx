import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

function getLabel(toolName: string, args: Record<string, unknown>): string {
  const filename =
    typeof args.path === "string"
      ? args.path.split("/").pop() ?? args.path
      : undefined;
  const suffix = filename ? ` ${filename}` : "";

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":
        return `Creating${suffix}`;
      case "str_replace":
      case "insert":
        return `Editing${suffix}`;
      case "view":
        return `Viewing${suffix}`;
      case "undo_edit":
        return `Undoing edit${suffix}`;
    }
  }
  if (toolName === "file_manager") {
    switch (args.command) {
      case "rename":
        return `Renaming${suffix}`;
      case "delete":
        return `Deleting${suffix}`;
    }
  }
  return toolName;
}

interface Props {
  tool: ToolInvocation;
}

export function ToolInvocationBadge({ tool }: Props) {
  const label = getLabel(tool.toolName, tool.args as Record<string, unknown>);
  const done = tool.state === "result" && tool.result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
