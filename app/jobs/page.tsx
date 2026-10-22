import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { redirect } from "next/navigation";
import CreateJobForm from "../components/CreateJobForm";
import Job from "../models/Job";
import Link from "next/link";
import { Suspense } from "react";
import { Types } from "mongoose";
import { revalidatePath } from "next/cache";

async function JobsContent() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  await connectDB();
  const jobs = await Job.find({ ownerId: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

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
        <div className="flex items-center justify-between p-4 bg-amber-300">
        <h1>NextJob</h1>
        {session.user.image && (
            <img className="rounded-full" src={session.user.image} alt="Profile" width={80} />
        )}
        </div>

        <div className="p-4">
          <CreateJobForm />
          <span className="bg-blue-500 text-white p-2 rounded-lg hover:underline">
            <Link href="/dashboard">Back to Dashboard</Link>
          </span>
          <span className="bg-green-500 text-white p-2 rounded-lg hover:underline">
            <Link href="/jobs/search">Search Jobs</Link>
          </span>
        </div>
      {jobs.length > 0 ? (
        <ul className="p-4">
          {jobs.map((job) => (
            <li className="border-b border-gray-300 py-2" key={job._id}>
              <h2>{job.title}</h2>
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
                <input type="hidden" name="jobId" value={job._id.toString()} />
                <button
                className="bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600"
                type="submit"
                >
                Delete
                </button>
            </form>
            )}

            {session.user.role !== 'admin' && session.user.id !== job.ownerId && (
                <form action={handleDelete}>
                  <input type="hidden" name="jobId" value={job._id.toString()} />
                  <button className="bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-red-600"  type="submit">Apply</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No jobs available.</p>
      )}


    </main>
  );
}

export default function CreateJobPage() {
  return (
    <Suspense fallback={<p className="p-4">Loading jobs...</p>}>
      <JobsContent />
    </Suspense>
  );
}
