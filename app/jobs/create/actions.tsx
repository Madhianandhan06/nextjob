
"use server";

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Job from "../../models/Job";
import { revalidatePath } from "next/cache";

type CreateJobInput = {
  title: string;
  company: string;
  description: string;
  location: string;
  jobType: "Full-time" | "Part-time" | "Contract" | "Internship";
  salary?: number;
  skills?: string[];
};

export async function createJob(input: CreateJobInput) {
  // 1. Identify the logged-in user.
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must sign in to create a job.");
  }

  // 2. Connect to MongoDB.
  await connectDB();

  // 3. Validate required fields on the server.
  const title = input.title?.trim();
  const company = input.company?.trim();
  const description = input.description?.trim();
  const location = input.location?.trim();

  if (!title || !company || !description || !location) {
    throw new Error("Please provide all required fields.");
  }

  if (
    !["Full-time", "Part-time", "Contract", "Internship"].includes(
      input.jobType
    )
  ) {
    throw new Error("Invalid job type.");
  }

  if (
    input.salary !== undefined &&
    (!Number.isFinite(input.salary) || input.salary < 0)
  ) {
    throw new Error("Invalid salary.");
  }

  // 4. Save the job under the authenticated user.
  const job = await Job.create({
    title,
    company,
    description,
    location,
    jobType: input.jobType,
    salary: input.salary,
    skills: Array.isArray(input.skills)
      ? input.skills.filter((skill) => typeof skill === "string")
      : [],
    ownerId: session.user.id,
  });

  // 5. Refresh the jobs page's cached route data.
  revalidatePath("/jobs");

  return {
    success: true,
    jobId: job._id.toString(),
  };
}
