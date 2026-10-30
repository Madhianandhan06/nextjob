"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Job = {
  _id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  jobType: string;
  salary?: number;
  skills: string[];
  ownerId: string;
};

type Props = {
  initialJobs: Job[];
  initialPage: number;
  userId: string;
  userRole?: string;
  handleDelete: (formData: FormData) => void | Promise<void>;
  hasMore: boolean;
  query: string;
  jobType: string;
};

export default function InfiniteJobs({
  initialJobs,
  initialPage,
  userId,
  userRole,
  handleDelete,
  hasMore,
  query,
  jobType,
}: Props) {
  const [jobs, setJobs] = useState(initialJobs);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [moreAvailable, setMoreAvailable] = useState(hasMore);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const requestInProgress = useRef(false);

  const loadMoreJobs = useCallback(async () => {
    if (requestInProgress.current || !moreAvailable) {
      return;
    }

    requestInProgress.current = true;
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        q: query,
        jobType,
      });
      const response = await fetch(`/api/jobs/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch jobs (${response.status}).`);
      }

      const data: { jobs?: Job[]; hasMore?: boolean } = await response.json();
      const newJobs = data.jobs;

      if (!Array.isArray(newJobs) || typeof data.hasMore !== "boolean") {
        throw new Error("The jobs API returned an invalid response.");
      }

      setJobs((currentJobs) => [...currentJobs, ...newJobs]);
      setMoreAvailable(data.hasMore);
      setPage((currentPage) => currentPage + 1);
    } catch (loadError) {
      console.error("Unable to load more jobs.", loadError);
      setError("Unable to load more jobs. Please try again.");
    } finally {
      requestInProgress.current = false;
      setLoading(false);
    }
  }, [jobType, moreAvailable, page, query]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !moreAvailable || loading || error) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMoreJobs();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [error, loadMoreJobs, loading, moreAvailable]);

  return (
    <section>
      <p className="px-4" aria-live="polite">
        {jobs.length} {jobs.length === 1 ? "job" : "jobs"} shown
      </p>

      <ul className="p-4">
        {jobs.map((job) => (
          <li
            className="my-3 list-none rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            key={job._id}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {job.title}
                </h2>
                <p className="mt-1 font-medium text-slate-700">{job.company}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                {job.jobType}
              </span>
            </div>

            <p className="mt-4 whitespace-pre-wrap leading-6 text-slate-600">
              {job.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-800">Location:</span>{" "}
                {job.location}
              </p>
              {job.salary !== undefined && (
                <p>
                  <span className="font-medium text-slate-800">Salary:</span>{" "}
                  ${job.salary}
                </p>
              )}
            </div>

            {job.skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                    key={skill}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {(userRole === "admin" || job.ownerId === userId) && (
              <form
                action={handleDelete}
                className="mt-5 border-t border-slate-100 pt-4"
              >
                <input type="hidden" name="jobId" value={job._id} />
                <button
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                  type="submit"
                >
                  Delete
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>

      {error && (
        <div className="p-4" role="alert">
          <p>{error}</p>
          <button
            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            type="button"
            onClick={() => void loadMoreJobs()}
          >
            Retry
          </button>
        </div>
      )}

      {loading && (
        <p className="p-4 text-center" aria-live="polite">
          Loading more jobs...
        </p>
      )}
      {moreAvailable && (
        <div ref={loadMoreRef} className="h-10" aria-hidden="true" />
      )}
    </section>
  );
}
