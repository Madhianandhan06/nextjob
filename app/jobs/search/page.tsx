import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { redirect } from "next/navigation";
import Job from "../../models/Job";
import Link from "next/link";
import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { Suspense } from "react";

const LIMIT = 5;
const jobTypes = ["Full-time", "Part-time", "Contract", "Internship"] as const;

type JobType = (typeof jobTypes)[number];

function isJobType(value: string): value is JobType {
  return jobTypes.includes(value as JobType);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function JobsContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;

  const page = Math.max(1, Number(params.page) || 1);

  const query = typeof params.q === "string" ? params.q.trim() : "";
  const jobType =
    typeof params.jobType === "string" && isJobType(params.jobType)
      ? params.jobType
      : "";
  const searchPattern = query ? escapeRegex(query) : "";

  await connectDB();
  const jobs = await Job.find({
    ...(searchPattern
      ? {
          $or: [
            { title: { $regex: searchPattern, $options: "i" } },
            { company: { $regex: searchPattern, $options: "i" } },
            { description: { $regex: searchPattern, $options: "i" } },
            { location: { $regex: searchPattern, $options: "i" } },
            { skills: { $regex: searchPattern, $options: "i" } },
          ],
        }
      : {}),
    ...(jobType ? { jobType } : {}),
  })
    .sort({ createdAt: -1 })
    .lean()
    .limit(page * LIMIT + 1);

  const hasMore = jobs.length > page * LIMIT;
  const visibleJobs = jobs.slice(0, page * LIMIT);
  async function handleDelete(formData: FormData) {
    "use server";

    const session = await auth();

    if (!session?.user?.id) {
      redirect("/login");
    }

    const role = session.user.role;

    if (!role || !["user", "recruiter", "admin"].includes(role)) {
      redirect("/jobs");
    }

    await connectDB();

    const jobId = formData.get("jobId");

    if (typeof jobId !== "string" || !Types.ObjectId.isValid(jobId)) {
      redirect("/jobs");
    }

    const filter =
      role === "admin"
        ? { _id: jobId }
        : { _id: jobId, ownerId: session.user.id };

    const deletedJob = await Job.findOneAndDelete(filter);

    if (!deletedJob) {
      redirect("/jobs");
    }

    revalidatePath("/jobs");
    redirect("/jobs");
  }

  return (
    <main>
      <div className="flex items-center justify-between bg-amber-300 p-4">
        <h1>NextJob</h1>
        {session.user.image && (
          <img
            className="rounded-full"
            src={session.user.image}
            alt="Profile"
            width={80}
          />
        )}
      </div>

      <div className="p-4">
        <span className="rounded-lg bg-blue-500 p-2 text-white hover:underline">
          <Link href="/dashboard">Back to Dashboard</Link>
        </span>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-4 p-4">
        <label className="flex flex-col gap-1">
          Search jobs
          <input
            className="rounded border border-slate-400 bg-slate-700 px-3 py-2 text-white"
            type="search"
            name="q"
            placeholder="Title, company, description, location, or skill"
            defaultValue={query}
          />
        </label>
        <label className="flex flex-col gap-1">
          Job type
          <select
            className="rounded border border-slate-400 bg-slate-700 px-3 py-2 text-white"
            name="jobType"
            defaultValue={jobType}
          >
            <option value="">All job types</option>
            {jobTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <button
          className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          type="submit"
        >
          Search
        </button>
        {(query || jobType) && (
          <Link className="px-2 py-2 underline" href="/jobs/search">
            Clear filters
          </Link>
        )}
      </form>

      <p className="px-4" aria-live="polite">
        {visibleJobs.length} {visibleJobs.length === 1 ? "job" : "jobs"} shown
      </p>

      {visibleJobs.length > 0 ? (
        <>
          <ul className="p-4">
            {visibleJobs.map((job) => (
              <li
                className="border-b border-gray-300 py-2"
                key={job._id.toString()}
              >
                <h2>{job.title}</h2>
                <p>{job.company}</p>
                <p>{job.description}</p>
                <p>{job.location}</p>
                <p>{job.jobType}</p>
                {job.salary && <p>Salary: ${job.salary}</p>}
                {job.skills && job.skills.length > 0 && (
                  <p>Skills: {job.skills.join(", ")}</p>
                )}
                {(session.user.role === "admin" ||
                  session.user.id === job.ownerId) && (
                  <form action={handleDelete}>
                    <input
                      type="hidden"
                      name="jobId"
                      value={job._id.toString()}
                    />
                    <button
                      className="rounded-lg bg-red-500 px-2 py-1 text-white hover:bg-red-600"
                      type="submit"
                    >
                      Delete
                    </button>
                  </form>
                )}
                {session.user.role !== "admin" &&
                  session.user.id !== job.ownerId && (
                    <form action={handleDelete}>
                      <input
                        type="hidden"
                        name="jobId"
                        value={job._id.toString()}
                      />
                      <button
                        className="rounded-lg bg-green-500 px-2 py-1 text-white hover:bg-red-600"
                        type="submit"
                      >
                        Apply
                      </button>
                    </form>
                  )}
              </li>
            ))}
          </ul>
          {hasMore && (
            <form action="/jobs/search" method="get" className="p-4">
              <input type="hidden" name="q" value={query} />
              <input type="hidden" name="jobType" value={jobType} />
              <input type="hidden" name="page" value={page + 1} />
              <button
                className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                type="submit"
              >
                Load 5 more jobs
              </button>
            </form>
          )}
        </>
      ) : (
        <p className="p-4">
          {query || jobType
            ? "No jobs match these filters. Try a different search."
            : "No jobs available."}
        </p>
      )}
    </main>
  );
}

export default function SearchJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense fallback={<p>Loading jobs...</p>}>
      <JobsContent searchParams={searchParams} />
    </Suspense>
  );
}
