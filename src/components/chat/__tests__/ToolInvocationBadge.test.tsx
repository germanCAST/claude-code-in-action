import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

function makeToolInvocation(
  toolName: string,
  args: Record<string, unknown>,
  done = true
): ToolInvocation {
  if (done) {
    return {
      toolCallId: "test-id",
      toolName,
      args,
      state: "result",
      result: "Success",
    };
  }
  return {
    toolCallId: "test-id",
    toolName,
    args,
    state: "call",
  };
}

test("str_replace_editor create shows Creating <filename>", () => {
  render(
    <ToolInvocationBadge
      tool={makeToolInvocation("str_replace_editor", {
        command: "create",
        path: "/App.jsx",
      })}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  // green dot present
  const dot = document.querySelector(".bg-emerald-500");
  expect(dot).toBeTruthy();
});

test("str_replace_editor str_replace shows Editing <filename>", () => {
  render(
    <ToolInvocationBadge
      tool={makeToolInvocation("str_replace_editor", {
        command: "str_replace",
        path: "/components/Card.jsx",
      })}
    />
  );
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

test("str_replace_editor insert shows Editing <filename>", () => {
  render(
    <ToolInvocationBadge
      tool={makeToolInvocation("str_replace_editor", {
        command: "insert",
        path: "/components/Card.jsx",
      })}
    />
  );
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

test("str_replace_editor view shows Viewing <filename>", () => {
  render(
    <ToolInvocationBadge
      tool={makeToolInvocation("str_replace_editor", {
        command: "view",
        path: "/components/Card.jsx",
      })}
    />
  );
  expect(screen.getByText("Viewing Card.jsx")).toBeDefined();
});

test("str_replace_editor undo_edit shows Undoing edit <filename>", () => {
  render(
    <ToolInvocationBadge
      tool={makeToolInvocation("str_replace_editor", {
        command: "undo_edit",
        path: "/components/Card.jsx",
      })}
    />
  );
  expect(screen.getByText("Undoing edit Card.jsx")).toBeDefined();
});

test("file_manager rename shows Renaming <filename>", () => {
  render(
    <ToolInvocationBadge
      tool={makeToolInvocation("file_manager", {
        command: "rename",
        path: "/components/OldName.jsx",
      })}
    />
  );
  expect(screen.getByText("Renaming OldName.jsx")).toBeDefined();
});

test("file_manager delete shows Deleting <filename>", () => {
  render(
    <ToolInvocationBadge
      tool={makeToolInvocation("file_manager", {
        command: "delete",
        path: "/components/OldName.jsx",
      })}
    />
  );
  expect(screen.getByText("Deleting OldName.jsx")).toBeDefined();
});

test("unknown tool shows raw tool name", () => {
  render(
    <ToolInvocationBadge
      tool={makeToolInvocation("some_unknown_tool", { command: "foo" })}
    />
  );
  expect(screen.getByText("some_unknown_tool")).toBeDefined();
});

test("executing state shows spinner not green dot", () => {
  render(
    <ToolInvocationBadge
      tool={makeToolInvocation(
        "str_replace_editor",
        { command: "create", path: "/App.jsx" },
        false
      )}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  expect(document.querySelector(".bg-emerald-500")).toBeNull();
  expect(document.querySelector(".animate-spin")).toBeTruthy();
});

test("missing path arg shows label without filename", () => {
  render(
    <ToolInvocationBadge
      tool={makeToolInvocation("str_replace_editor", { command: "create" })}
    />
  );
  expect(screen.getByText("Creating")).toBeDefined();
});
