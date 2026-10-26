
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";



export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "questions.csv");
    const csvText = await readFile(filePath, "utf8");

    const records = parse(csvText, {
      bom: true,
      columns: (headers: string[]) =>
        headers.map((header) => header.trim()),
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    if (records.length === 0) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลข้อสอบ" },
        { status: 404 }
      );
    }

    const questions = records.map((row, index) => {
      const keys = Object.keys(row);

      const findValue = (patterns: RegExp[]) => {
        const key = keys.find((k) =>
          patterns.some((pattern) => pattern.test(k))
        );
        return key ? row[key]?.trim() ?? "" : "";
      };

      const question = findValue([
        /คำถาม/,
        /โจทย์/,
        /question/i,
      ]);

      const optionA = findValue([/^ก\.?$/, /ตัวเลือก\s*ก/, /^a$/i, /^option\s*a$/i]);
      const optionB = findValue([/^ข\.?$/, /ตัวเลือก\s*ข/, /^b$/i, /^option\s*b$/i]);
      const optionC = findValue([/^ค\.?$/, /ตัวเลือก\s*ค/, /^c$/i, /^option\s*c$/i]);
      const optionD = findValue([/^ง\.?$/, /ตัวเลือก\s*ง/, /^d$/i, /^option\s*d$/i]);

      return {
        id: index + 1,
        question,
        options: [
          { label: "ก", text: optionA },
          { label: "ข", text: optionB },
          { label: "ค", text: optionC },
          { label: "ง", text: optionD },
        ].filter((option) => option.text !== ""),
      };
    });

    const validQuestions = questions.filter(
      (question) => question.question && question.options.length > 0
    );

    if (validQuestions.length === 0) {
      return NextResponse.json(
        {
          error:
            "อ่านไฟล์ CSV ได้ แต่ไม่พบคอลัมน์คำถามหรือตัวเลือกที่ระบบรู้จัก กรุณาตรวจสอบชื่อหัวตาราง",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ questions: validQuestions });
  } catch (error) {
    console.error("อ่านไฟล์ข้อสอบไม่สำเร็จ:", error);

    return NextResponse.json(
      {
        error:
          "ไม่สามารถอ่านไฟล์ข้อสอบได้ กรุณาตรวจสอบว่า data/questions.csv มีอยู่จริง",
      },
      { status: 500 }
    );
  }
}
