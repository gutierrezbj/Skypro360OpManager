import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validatePilotLicense } from "@/modules/integrations/services/aesa.service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const license = req.nextUrl.searchParams.get("license");
  if (!license) {
    return NextResponse.json(
      { error: "Missing license parameter" },
      { status: 400 },
    );
  }

  const result = await validatePilotLicense(license);
  return NextResponse.json(result);
}
