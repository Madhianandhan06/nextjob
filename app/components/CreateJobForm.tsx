
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJob } from "@/app/jobs/create/actions";

export default function CreateJobForm() {
  const router = useRouter();

  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError("");

    try {
      const salaryValue = String(formData.get("salary") ?? "").trim();

      const result = await createJob({
        title: String(formData.get("title") ?? ""),
        company: String(formData.get("company") ?? ""),
        description: String(formData.get("description") ?? ""),
        location: String(formData.get("location") ?? ""),
        jobType: formData.get("jobType") as
          | "Full-time"
          | "Part-time"
          | "Contract"
          | "Internship",
        ...(salaryValue !== ""
          ? { salary: Number(salaryValue) }
          : {}),
        skills: String(formData.get("skills") ?? "")
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
      });

      if (result.success) {
        router.push("/jobs");
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create job."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600" type="button" onClick={() => setOpen(true)}>
        Create a job
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-job-title"
            className="max-h-full w-full max-w-md overflow-y-auto rounded-lg bg-slate-800 p-4 text-white"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="create-job-title" className="text-xl font-semibold">
                Create a job
              </h2>
              <button className="bg-gray-500 text-white p-2 rounded-lg hover:bg-gray-600" type="button" onClick={() => setOpen(false)} aria-label="Close">
                Close
              </button>
            </div>

            <form
              className="space-y-4 flex flex-col items-center"
              action={handleSubmit}
            >
              <label>
                Job title
                <input className="bg-slate-600 text-white placeholder:text-slate-400 border border-slate-500 focus:ring-blue-500 focus:outline-none" name="title" required maxLength={120} />
              </label>

              <label>
                Company
                <input className="bg-slate-600 text-white placeholder:text-slate-400 border border-slate-500 focus:ring-blue-500 focus:outline-none" name="company" required maxLength={120} />
              </label>

              <label>
                Description
                <textarea className="bg-slate-600 text-white placeholder:text-slate-400 border border-slate-500 focus:ring-blue-500 focus:outline-none" name="description" required maxLength={10000} />
              </label>

              <label>
                Location
                <input className="bg-slate-600 text-white placeholder:text-slate-400 border border-slate-500 focus:ring-blue-500 focus:outline-none" name="location" required maxLength={150} />
              </label>

              <label>
                Job type
                <select className="bg-slate-600 text-white placeholder:text-slate-400 border border-slate-500 focus:ring-blue-500 focus:outline-none" name="jobType" required defaultValue="Full-time">
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </label>

              <label>
                Annual salary
                <input className="bg-slate-600 text-white placeholder:text-slate-400 border border-slate-500 focus:ring-blue-500 focus:outline-none"   name="salary" type="number" min="0" step="any" />
              </label>

              <label>
                Skills (comma-separated)
                <input className="bg-slate-600 text-white placeholder:text-slate-400 border border-slate-500 focus:ring-blue-500 focus:outline-none" name="skills" placeholder="React, Next.js, MongoDB" />
              </label>

              {error && <p role="alert">{error}</p>}

              <button className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600" type="submit" disabled={pending}>
                {pending ? "Creating..." : "Create job"}
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
