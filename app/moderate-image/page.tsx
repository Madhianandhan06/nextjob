"use client";

import { useState, useEffect, type FormEvent } from "react";
import Image from "next/image";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function getErrorMessage(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }

  return "Image moderation failed";
}

export default function Page() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (previewUrl) {
      return () => URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const image = formData.get("image");

    if (!(image instanceof File) || image.size === 0) {
      setError("Choose an image to upload.");
      return;
    }

    if (image.size > MAX_FILE_SIZE) {
      setError("The image must be 20 MB or smaller.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/moderate-image", {
        method: "POST",
        body: formData,
      });
      const data: unknown = await response.json();

      if (!response.ok) {
        setError(getErrorMessage(data));
        return;
      }

      setResult(JSON.stringify(data, null, 2));
    } catch {
      setError("Could not reach the moderation service. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">Moderate an image</h1>
      <p className="mb-6 text-muted-foreground">
        Choose an image from your device to check it with the OpenAI moderation API.
        JPEG, PNG, GIF, and WebP files up to 20 MB are supported.
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="image">
            Image
          </label>

          {previewUrl && (
            <div className="relative mt-4 h-80 w-full">
              <Image
                src={previewUrl}
                alt="Selected image preview"
                fill
                unoptimized
                className="rounded-md object-contain"
              />
            </div>
          )}

          <input
            accept="image/jpeg,image/png,image/gif,image/webp"
            id="image"
            name="image"
            className="block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
            required
            type="file"
            onChange={(event) => {
              const image = event.target.files?.[0];
              setPreviewUrl(image ? URL.createObjectURL(image) : null);
            }}
          />
        </div>

        <button
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "Checking image..." : "Upload and moderate"}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {result && (
        <section className="mt-6 bg-slate-800 p-4 rounded-md" aria-labelledby="result-heading">
          <h2 className="mb-2 text-lg font-medium" id="result-heading">
            Moderation result
          </h2>
          <pre className="overflow-auto bg-slate-900 rounded-md p-4 text-sm">
            {result}
          </pre>
        </section>
      )}
    </main>
  );
}
