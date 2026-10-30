import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Job from "../../../models/Job";

const LIMIT = 5;
const jobTypes = ["Full-time", "Part-time", "Contract", "Internship"] as const;

function isJobType(value: string) {
  return jobTypes.includes(value as (typeof jobTypes)[number]);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawPage = searchParams.get("page") ?? "2";
  const page = Number(rawPage);
  const query = searchParams.get("q")?.trim() ?? "";
  const jobType = searchParams.get("jobType") ?? "";

  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    (jobType !== "" && !isJobType(jobType))
  ) {
    return Response.json({ message: "Invalid search parameters" }, { status: 400 });
  }

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
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * LIMIT)
    .limit(LIMIT + 1)
    .lean();

  const hasMore = jobs.length > LIMIT;
  const visibleJobs = jobs.slice(0, LIMIT).map((job) => ({
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

  return Response.json({ jobs: visibleJobs, hasMore });
}