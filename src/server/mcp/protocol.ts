// Minimal stateless MCP server over Streamable HTTP (JSON-RPC on a single
// POST endpoint). Only what our tools need — initialize, tools/list,
// tools/call — is implemented; there is no session state, so every request is
// answered with one JSON body (the spec's non-SSE mode). Hand-rolled rather
// than pulling the SDK: the protocol surface here is three methods.

import { getTools, runTool } from "./tools";

// Protocol revisions we accept; echoed back when the client asks for one of
// them, newest offered otherwise.
const SUPPORTED_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];

const SERVER_INFO = { name: "laigary-blog", version: "1.0.0" };

type JsonRpcId = string | number | null;

export type McpHttpResponse = {
  status: number;
  body?: unknown;
};

function result(id: JsonRpcId, payload: unknown): McpHttpResponse {
  return { status: 200, body: { jsonrpc: "2.0", id, result: payload } };
}

function rpcError(id: JsonRpcId, code: number, message: string): McpHttpResponse {
  return { status: 200, body: { jsonrpc: "2.0", id, error: { code, message } } };
}

// One JSON-RPC message in → one HTTP response out. `authorized` gates the
// write tools (both their listing and their execution).
export async function handleMcpMessage(
  message: unknown,
  authorized: boolean,
): Promise<McpHttpResponse> {
  if (typeof message !== "object" || message === null || Array.isArray(message)) {
    return rpcError(null, -32600, "Expected a single JSON-RPC message");
  }
  const { id, method, params } = message as {
    id?: JsonRpcId;
    method?: string;
    params?: Record<string, unknown>;
  };

  if (typeof method !== "string") {
    return rpcError(id ?? null, -32600, "Missing method");
  }

  // Notifications (no id) need no body; acknowledge and move on.
  if (id === undefined) {
    return { status: 202 };
  }

  switch (method) {
    case "initialize": {
      const requested = (params?.protocolVersion as string) ?? "";
      return result(id, {
        protocolVersion: SUPPORTED_VERSIONS.includes(requested) ? requested : SUPPORTED_VERSIONS[0],
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });
    }
    case "ping":
      return result(id, {});
    case "tools/list":
      return result(id, {
        tools: getTools(authorized).map(({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema,
        })),
      });
    case "tools/call": {
      const name = params?.name;
      if (typeof name !== "string") {
        return rpcError(id, -32602, "tools/call requires a tool name");
      }
      const outcome = await runTool(name, params?.arguments ?? {}, authorized);
      return result(id, outcome);
    }
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}
