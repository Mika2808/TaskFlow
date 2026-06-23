import { ApiError } from "../api";

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Wrong credentials. Please check your email/nick and password.";
    }

    if (error.status === 400) {
      return "Invalid request. Please check the form and try again.";
    }

    if (error.status === 409) {
      const lower = (error.message || "").toLowerCase();
      if (lower.includes("nick")) {
        return "That nick is already taken. Please choose another.";
      }
      if (lower.includes("email")) {
        return "That email is already registered. Try signing in or use a different email.";
      }

      return error.message || "Conflict: the resource already exists.";
    }

    return error.message || "Something went wrong. Please try again.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
