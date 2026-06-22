<img src="logo.svg" width="80" alt="agentwire" />

# agentwire

A tiny, typed **pub/sub event bus that wires agent tools to your UI** — with
first-class support for *interactive* (deferred) tools like "ask the user" and
"choose a component". Extracted from a production Next.js + Vercel AI SDK app and
generalized into framework-agnostic layers.

📚 **[Documentation](https://docs-lemon-alpha.vercel.app/docs)** · 🧪 **[Full example](https://docs-lemon-alpha.vercel.app/docs/full-example)**

## Packages

| Package | What it is | Deps |
| --- | --- | --- |
| [`@kovenlabs/agentwire`](./packages/core) | The bus: `publish`/`subscribe`/`request`, typed channel registry, interactive-tool primitives, logger interfaces. | none |
| [`@kovenlabs/agentwire-tools`](./packages/tools) | `defineTool` factory (`server`/`client`/`approval`/`interactive`) + tool registry. | Standard Schema |
| [`@kovenlabs/agentwire-react`](./packages/react) | Generic React hooks: `useSubscribe`, `useRequest`, `useFormBridge`. | react |
| [`@kovenlabs/agentwire-ai-sdk`](./packages/ai-sdk) | **The adapter.** `toAiTool`/`toAiToolSet` + the `useAgentChat` runtime. | `ai`, `@ai-sdk/react` |

The core is framework-agnostic. The AI SDK coupling lives entirely in the adapter
package — swap in a different LLM SDK later by writing a sibling adapter without
touching anything else.

## The idea

```
              @kovenlabs/agentwire (bus)
    publish / subscribe / request — synchronous, in-memory
                     │
   ┌─────────────────┼──────────────────────┐
   ▼                 ▼                       ▼
server tools     client tools          interactive tools
(execute on      (your handlers:       (defer to UI; the UI
 the server →    navigate, banners)    publishes the result on
 publish result)                        the resolve channel →
                                        runtime calls addToolOutput)
```

## Quick start

A slice of a flight-booking agent — the full walkthrough is in the
[docs](https://docs-lemon-alpha.vercel.app/docs/getting-started).

```ts
// 1. Declare tools once — a `server` tool and an `interactive` one
import { defineTool } from "@kovenlabs/agentwire-tools";
import { z } from "zod";

export const searchFlights = defineTool.server({
  name: "searchFlights",
  description: "Search flights between two cities on a date.",
  label: "Searching flights",
  inputSchema: z.object({ from: z.string(), to: z.string(), date: z.string() }),
  execute: ({ from, to, date }) => flightsApi.search({ from, to, date }),
});

export const pickFlight = defineTool.interactive({
  name: "pickFlight",
  description: "Show the flights and let the traveler choose one.",
  label: "Choosing a flight",
  inputSchema: z.object({
    options: z.array(z.object({ id: z.string(), airline: z.string(), price: z.number() })),
  }),
});

export const tools = { searchFlights, pickFlight };
```

```ts
// 2. Server route — convert to AI SDK tools
import { toAiToolSet } from "@kovenlabs/agentwire-ai-sdk";
import { consoleLogger } from "@kovenlabs/agentwire";
import { streamText } from "ai";

streamText({
  model,
  messages,
  tools: toAiToolSet(tools, { logger: consoleLogger }),
});
```

```tsx
// 3. Client — wire the chat once (interactive tools auto-detected)
import { useAgentChat } from "@kovenlabs/agentwire-ai-sdk/react";

const chat = useAgentChat({ chatId, api: "/api/chat" });
```

```tsx
// 4. Render the stream — <AgentMessages> mounts your interactive widgets,
//    renders Approve/Deny for approval tools, and shows status → output.
import { AgentMessages, completeInteractive } from "@kovenlabs/agentwire-ai-sdk/react";

function FlightGallery({ toolCallId, input }) {
  // settle the open call from the UI:
  const choose = (flightId) => completeInteractive("pickFlight", toolCallId, { flightId });
  return input.options.map((f) => <button key={f.id} onClick={() => choose(f.id)}>{f.airline}</button>);
}

<AgentMessages
  chat={chat}
  interactive={{ pickFlight: FlightGallery }}
  slots={{ text: (t) => <p>{t}</p> }}
/>;
```

```tsx
// 5. (optional) React to results anywhere — off-chat, via the bus
import { useToolResult, useInteractiveResult } from "@kovenlabs/agentwire-ai-sdk/react";

useToolResult("searchFlights", (flights) => setFlights(flights));
useInteractiveResult("pickFlight", (picked) => setSelected(picked));
```

## Develop

```bash
pnpm install
pnpm build      # tsup → ESM + CJS + d.ts per package
pnpm test       # vitest
pnpm typecheck
```

Releases are automated with **semantic-release** (conventional commits) — pushing
to `main` cuts the version, changelog, GitHub release, and npm publish via CI.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) — setup, the monorepo layout, and the
Conventional Commits convention the release pipeline depends on.

## License

[MIT](./LICENSE) © kovenlabs
