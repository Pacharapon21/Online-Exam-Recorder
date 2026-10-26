
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");

  function handleStartExam(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedStudentId = studentId.trim();

    if (!trimmedName || !trimmedStudentId) {
      setError("กรุณากรอกชื่อและรหัสนักศึกษาให้ครบถ้วน");
      return;
    }

    // เก็บข้อมูลผู้เข้าสอบไว้ชั่วคราวในเบราว์เซอร์
    sessionStorage.setItem("examStudentName", trimmedName);
    sessionStorage.setItem("examStudentId", trimmedStudentId);

    // ไปยังหน้าข้อสอบ
    router.push("/exam");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/15 text-3xl">
            📝
          </div>

          <p className="text-sm font-semibold tracking-[0.25em] text-blue-400">
            ONLINE EXAMINATION
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            แบบทดสอบออนไลน์
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            กรุณากรอกข้อมูลนักศึกษาก่อนเริ่มทำข้อสอบ
          </p>
        </div>

        <form onSubmit={handleStartExam} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium"
            >
              ชื่อ - นามสกุล
            </label>

            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="กรอกชื่อและนามสกุล"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              required
            />
          </div>

          <div>
            <label
              htmlFor="studentId"
              className="mb-2 block text-sm font-medium"
            >
              รหัสนักศึกษา
            </label>

            <input
              id="studentId"
              type="text"
              autoComplete="off"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="กรอกรหัสนักศึกษา"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              required
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            เริ่มทำข้อสอบ →
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          โปรดตรวจสอบข้อมูลของคุณก่อนเริ่มทำข้อสอบ
        </p>
      </section>
    </main>
  );
}
