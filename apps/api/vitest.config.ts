import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    server: {
      deps: {
        // The Anthropic SDK's subpath exports (helpers/beta/*) use wildcard
        // patterns vite-node fails to resolve when inlining; let Node's own
        // resolver load the package instead.
        external: [/@anthropic-ai\/sdk/],
      },
    },
  },
});
