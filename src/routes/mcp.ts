import { createFileRoute } from "@tanstack/react-router";

// MCP endpoint (Streamable HTTP, stateless): AI clients connect to
// https://laigary.com/mcp. Read tools are public; write tools need
// `Authorization: Bearer <MCP_ADMIN_TOKEN>`. All logic lives in
// src/server/mcp/ (dynamic import keeps it out of the client bundle).

export const Route = createFileRoute("/mcp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleMcpPost } = await import("@/server/mcp/http");
        return handleMcpPost(request);
      },
      // Stateless server: no SSE stream to offer on GET, no session to delete.
      GET: () => new Response(null, { status: 405, headers: { Allow: "POST" } }),
      DELETE: () => new Response(null, { status: 405, headers: { Allow: "POST" } }),
    },
  },
});
