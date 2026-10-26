
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const answers = body.answers;
    const studentName = String(body.studentName ?? "").trim();
    const studentId = String(body.studentId ?? "").trim();

    if (
      !answers ||
      typeof answers !== "object" ||
      Array.isArray(answers)
    ) {
      return NextResponse.json(
        { error: "ข้อมูลคำตอบไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const filePath = path.join(
      process.cwd(),
      "data",
      "questions.csv"
    );

    const csvText = await readFile(filePath, "utf8");

    const records = parse(csvText, {
      bom: true,
      columns: (headers: string[]) =>
        headers.map((header) => header.trim()),
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    const validRecords = records.filter(
      (row) => row["คำถาม"]?.trim()
    );

    if (validRecords.length === 0) {
      return NextResponse.json(
        { error: "ไม่พบข้อสอบในไฟล์ CSV" },
        { status: 422 }
      );
    }

    const allowedLabels = ["ก", "ข", "ค", "ง"];

    let score = 0;
    let answered = 0;

    for (let index = 0; index < validRecords.length; index++) {
      const row = validRecords[index];
      const correctAnswer = row["เฉลย"]?.trim();
      const studentAnswer = answers[index + 1];

      if (
        !allowedLabels.includes(correctAnswer) ||
        ![
          "ตัวเลือก ก",
          "ตัวเลือก ข",
          "ตัวเลือก ค",
          "ตัวเลือก ง",
        ].some((key) => row[key]?.trim())
      ) {
        return NextResponse.json(
          {
            error: `ข้อมูลเฉลยของข้อ ${index + 1} ไม่ถูกต้อง`,
          },
          { status: 422 }
        );
      }

      if (allowedLabels.includes(studentAnswer)) {
        answered++;

        if (studentAnswer === correctAnswer) {
          score++;
        }
      }
    }

    const total = validRecords.length;
    const result = {
      score,
      total,
      answered,
      incorrect: answered - score,
      unanswered: total - answered,
      percentage: Math.round((score / total) * 100),
    };

    // ส่งผลสอบไป Google Sheets
    let savedToSheets = false;

    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    const secret = process.env.GOOGLE_SCRIPT_SECRET;

    if (studentName && studentId && scriptUrl && secret) {
      try {
        const response = await fetch(scriptUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            secret,
            studentName,
            studentId,
            ...result,
          }),
          cache: "no-store",
        });

        const responseText = await response.text();
        const sheetResult = JSON.parse(responseText);

        if (!response.ok || sheetResult.success !== true) {
          throw new Error(
            sheetResult.message || "บันทึก Google Sheets ไม่สำเร็จ"
          );
        }

        savedToSheets = true;
      } catch (error) {
        console.error(
          "ส่งผลสอบไป Google Sheets ไม่สำเร็จ:",
          error
        );
      }
    } else {
      console.error(
        "ไม่พบชื่อ รหัสนักศึกษา หรือค่าตั้งค่า Google Sheets"
      );
    }

    return NextResponse.json({
      ...result,
      savedToSheets,
    });
  } catch (error) {
    console.error("ตรวจคะแนนไม่สำเร็จ:", error);

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดขณะตรวจคะแนน" },
      { status: 500 }
    );
  }
}
