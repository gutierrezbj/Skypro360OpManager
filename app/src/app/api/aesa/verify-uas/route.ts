import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyUasRegistration } from "@/modules/integrations/services/aesa.service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const registration = req.nextUrl.searchParams.get("registration");
  if (!registration) {
    return NextResponse.json(
      { error: "Missing registration parameter" },
      { status: 400 },
    );
  }

  const result = await verifyUasRegistration(registration);
  return NextResponse.json(result);
}
