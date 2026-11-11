import { NextRequest, NextResponse } from "next/server";
import { executeCmsMutation, readJsonBodyWithLimit, CmsMutationRequest } from "@/lib/cmsAuthGuard";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // 1. Read request body with streaming size enforcement (max 256 KB)
  const bodyResult = await readJsonBodyWithLimit(request, 262144);
  if ("errorResponse" in bodyResult) {
    return bodyResult.errorResponse;
  }

  const body = bodyResult.data;

  // 2. Validate that body is a plain JSON object (not null, not array)
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Request body must be a plain JSON object." },
      { status: 400 }
    );
  }

  const typedBody = body as Record<string, unknown>;

  // 3. Validate that payload, if provided, is a plain JSON object
  if (
    typedBody.payload !== undefined &&
    (typeof typedBody.payload !== "object" || typedBody.payload === null || Array.isArray(typedBody.payload))
  ) {
    return NextResponse.json(
      { error: "Payload field must be a plain JSON object." },
      { status: 400 }
    );
  }

  // 4. Construct sanitized mutation data (discarding any client-supplied admin identity)
  const mutationData: CmsMutationRequest = {
    entity: String(typedBody.entity || ""),
    recordId: String(typedBody.recordId || typedBody.record_id || ""),
    action: String(typedBody.action || ""),
    payload: (typedBody.payload as Record<string, unknown>) || {},
    changeSummary: typedBody.changeSummary || typedBody.change_summary
      ? String(typedBody.changeSummary || typedBody.change_summary)
      : undefined,
  };

  if (!mutationData.entity || !mutationData.action) {
    return NextResponse.json(
      { error: "Fields 'entity' and 'action' are required." },
      { status: 400 }
    );
  }

  return await executeCmsMutation(request, mutationData);
}

