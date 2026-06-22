"use client";

import { getToolDisplay } from "@kovenlabs/agentwire-tools";
import { getToolName, isToolUIPart, type UIMessage } from "ai";
import { type ComponentType, Fragment, type ReactNode } from "react";

/** Props an interactive widget receives: the open call's id and its input. */
export interface ToolWidgetProps {
  toolCallId: string;
  // biome-ignore lint/suspicious/noExplicitAny: each tool's input shape differs
  input: any;
}

/** Map of interactive tool name → the widget that renders while its call is open. */
export type InteractiveRegistry = Record<string, ComponentType<ToolWidgetProps>>;

/** Answer an approval-gated tool — the AI SDK's `addToolApprovalResponse`. */
export type ApprovalResponder = (response: { id: string; approved: boolean }) => void;

/** Override how non-widget parts render. All optional — sensible defaults apply. */
export interface ToolPartSlots {
  text?: (text: string) => ReactNode;
  status?: (info: { toolName: string; label: string; state: string }) => ReactNode;
  output?: (info: { toolName: string; output: unknown }) => ReactNode;
  error?: (info: { toolName: string; label: string; errorText?: string }) => ReactNode;
  approval?: (info: {
    toolName: string;
    description?: string;
    input: unknown;
    respond: (approved: boolean) => void;
  }) => ReactNode;
}

export interface RenderPartsOptions {
  /** Interactive tools → widgets. Mounted at the `input-available` state. */
  interactive?: InteractiveRegistry;
  /**
   * Answers approval-gated tools (`defineTool.approval`). Pass
   * `chat.addToolApprovalResponse`; approval cards are auto-detected from the
   * tool part's `approval-requested` state.
   */
  addToolApprovalResponse?: ApprovalResponder;
  slots?: ToolPartSlots;
}

function DefaultApproval({
  description,
  respond,
}: {
  description?: string;
  respond: (approved: boolean) => void;
}) {
  return (
    <div>
      <p>{description ?? "Approve this action?"}</p>
      <button type="button" onClick={() => respond(true)}>
        Approve
      </button>
      <button type="button" onClick={() => respond(false)}>
        Deny
      </button>
    </div>
  );
}

/**
 * Render one `UIMessage`'s parts: text, interactive widgets (from `interactive`),
 * approval cards (auto-detected on the `approval-requested` state), and a
 * status/label → output progression for everything else. This is the
 * message-renderer boilerplate, abstracted.
 */
export function renderMessageParts(message: UIMessage, options: RenderPartsOptions = {}): ReactNode {
  const { interactive = {}, addToolApprovalResponse, slots = {} } = options;

  return message.parts.map((part, index) => {
    if (part.type === "text") {
      return <Fragment key={index}>{slots.text ? slots.text(part.text) : part.text}</Fragment>;
    }
    if (!isToolUIPart(part)) return null;

    const toolName = getToolName(part);
    const { toolCallId, state } = part;
    const display = getToolDisplay(toolName);

    // Approval-gated tools (needsApproval): render Approve/Deny. The AI SDK puts
    // the part in `approval-requested` state and exposes `part.approval.id`.
    // (String-compared + cast so it works across ai@5/ai@6 type shapes.)
    if ((state as string) === "approval-requested") {
      const approvalId = (part as { approval?: { id?: string } }).approval?.id ?? "";
      const respond = (approved: boolean) => addToolApprovalResponse?.({ id: approvalId, approved });
      const info = {
        toolName,
        description: display.description,
        input: (part as { input?: unknown }).input,
        respond,
      };
      return (
        <Fragment key={toolCallId}>
          {slots.approval ? slots.approval(info) : <DefaultApproval {...info} />}
        </Fragment>
      );
    }

    // Interactive tools: mount the registered widget while the call is open.
    const Widget = interactive[toolName];
    if (Widget && state === "input-available") {
      return <Widget key={toolCallId} toolCallId={toolCallId} input={part.input} />;
    }

    switch (state) {
      case "input-streaming":
      case "input-available":
        return (
          <Fragment key={toolCallId}>
            {slots.status ? slots.status({ toolName, label: display.label, state }) : `${display.label}…`}
          </Fragment>
        );
      case "output-available":
        return slots.output ? (
          <Fragment key={toolCallId}>{slots.output({ toolName, output: part.output })}</Fragment>
        ) : null;
      case "output-error":
        return (
          <Fragment key={toolCallId}>
            {slots.error
              ? slots.error({ toolName, label: display.label, errorText: part.errorText })
              : `${display.label} failed`}
          </Fragment>
        );
      default:
        return null;
    }
  });
}

export interface AgentMessagesProps extends RenderPartsOptions {
  /** The object returned by `useAgentChat` (needs `messages`; uses `addToolApprovalResponse` for approvals). */
  chat: { messages: UIMessage[]; addToolApprovalResponse?: ApprovalResponder };
  /** Wrap each message (defaults to a `<div>`); receives the rendered parts. */
  renderMessage?: (message: UIMessage, parts: ReactNode) => ReactNode;
}

/**
 * Render an entire message list with tool parts wired up. The common case:
 *
 * ```tsx
 * <AgentMessages
 *   chat={chat}
 *   interactive={{ pickFlight: FlightGallery, collectPassenger: PassengerForm }}
 *   slots={{ text: (t) => <p>{t}</p> }}
 * />
 * ```
 */
export function AgentMessages({
  chat,
  renderMessage,
  addToolApprovalResponse,
  ...rest
}: AgentMessagesProps) {
  const respond = addToolApprovalResponse ?? chat.addToolApprovalResponse;
  return (
    <>
      {chat.messages.map((message) => {
        const parts = renderMessageParts(message, { ...rest, addToolApprovalResponse: respond });
        return (
          <Fragment key={message.id}>
            {renderMessage ? renderMessage(message, parts) : <div>{parts}</div>}
          </Fragment>
        );
      })}
    </>
  );
}
