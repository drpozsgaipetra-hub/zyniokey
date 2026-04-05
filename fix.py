content = open('app/api/transcribe/route.ts').read()
new_content = '''import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const openaiForm = new FormData();
    openaiForm.append("file", file as Blob, "recording.webm");
    openaiForm.append("model", "whisper-1");
    openaiForm.append("language", "hu");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY },
      body: openaiForm,
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}'''
open('app/api/transcribe/route.ts', 'w').write(new_content)
