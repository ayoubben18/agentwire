import { createFromSource } from "fumadocs-core/search/server";
import { source } from "@/lib/source";

// Builds the search index from the docs source and serves the query endpoint
// the Fumadocs Cmd+K dialog hits (`/api/search`).
export const { GET } = createFromSource(source);
