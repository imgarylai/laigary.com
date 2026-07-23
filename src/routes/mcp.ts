import { createFileRoute } from "@tanstack/react-router";

// MCP endpoint (Streamable HTTP, stateless): AI clients connect to
// https://laigary.com/mcp. Read tools are public; write tools need
// `Authorization: Bearer <MCP_ADMIN_TOKEN>`. Everything protocol-shaped lives
// in src/server/mcp/ (dynamic imports keep it out of the client bundle).

async function handlePost(request: Request): Promise<Response> {
  const { handleMcpMessage } = await import("@/server/mcp/protocol");
  const { checkAuthorization } = await import("@/server/mcp/auth");
  const { mcpEnv } = await import("@/server/mcp/env");

  let message: unknown;
  try {
    message = await request.json();
  } catch {
    return Response.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      { status: 200 },
    );
  }

  const authorized = await checkAuthorization(
    request.headers.get("authorization"),
    mcpEnv().MCP_ADMIN_TOKEN,
  );

  const { status, body } = await handleMcpMessage(message, authorized);
  return body === undefined ? new Response(null, { status }) : Response.json(body, { status });
}

export const Route = createFileRoute("/mcp")({
  server: {
    handlers: {
      POST: ({ request }) => handlePost(request),
      // Stateless server: no SSE stream to offer on GET, no session to delete.
      GET: () => new Response(null, { status: 405, headers: { Allow: "POST" } }),
      DELETE: () => new Response(null, { status: 405, headers: { Allow: "POST" } }),
    },
  },
});
