// HTTP layer for the /mcp endpoint: body parsing, bearer-token check, and the
// JSON-RPC dispatch. Lives outside the route file so it's unit-testable; the
// route imports it dynamically (client bundle stays clean).

import { handleMcpMessage } from "./protocol";
import { checkAuthorization } from "./auth";

export async function handleMcpPost(request: Request): Promise<Response> {
  const { mcpEnv } = await import("./env");

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
