import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

/** Shared layout options (nav, GitHub link) used by the docs + home layouts. */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
          {/* biome-ignore lint/a11y/useAltText: decorative mark next to the wordmark */}
          <img src="/logo.svg" width={22} height={22} alt="" style={{ borderRadius: 5 }} />
          agentwire
        </span>
      ),
    },
    githubUrl: "https://github.com/kovenlabs/agentwire",
  };
}
