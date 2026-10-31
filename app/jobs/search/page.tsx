import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { redirect } from "next/navigation";
import Job from "../../models/Job";
import Link from "next/link";
import Image from "next/image";
import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { Suspense } from "react";

import InfiniteJobs from "@/app/components/InfiniteJobs";

const searchText = "what's india's capital city?";
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

  if (!session?.user?.id) {
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
  const visibleJobs = jobs.slice(0, page * LIMIT).map((job) => ({
    _id: job._id.toString(),
    title: job.title,
    company: job.company,
    description: job.description,
    location: job.location,
    jobType: job.jobType,
    ...(job.salary !== undefined ? { salary: job.salary } : {}),
    skills: Array.isArray(job.skills) ? job.skills : [],
    ownerId: String(job.ownerId),
  }));

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
      <Link
        href={`https://www.google.com/search?q=${encodeURIComponent(searchText)}&udm=2&tbm=isch`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Search Google
      </Link>

          <Image
            src="/nature.webp"
            alt="Hero Banner"
            width={1200}
            height={600}
            className="w-full h-auto my-4"
          />
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

      <InfiniteJobs
        initialJobs={visibleJobs}
        initialPage={page}
        userId={session.user.id}
        userRole={session.user.role}
        handleDelete={handleDelete}
        hasMore={hasMore}
        query={query}
        jobType={jobType}
      />

      {visibleJobs.length === 0 && (
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
