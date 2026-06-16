export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  "https://localhost:7230/api";

type RequestOptions = {
  token?: string | null;
  query?: Record<string, string | number | undefined | null>;
  body?: unknown;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function request<T>(
  path: string,
  method = "GET",
  options: RequestOptions = {},
): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);

  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new ApiError(getProblemMessage(data), response.status);
  }

  return data as T;
}

function getProblemMessage(data: unknown) {
  if (typeof data === "string" && data.length > 0) {
    return data;
  }

  if (data && typeof data === "object") {
    const problem = data as {
      title?: string;
      detail?: string;
      errors?: Record<string, string[]>;
    };
    const validation = problem.errors
      ? Object.values(problem.errors).flat().join(" ")
      : "";

    return [problem.title, problem.detail, validation].filter(Boolean).join(" ");
  }

  return "Something went wrong. Please try again.";
}
