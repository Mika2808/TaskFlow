import { request } from "./client";
import type { CurrentUser } from "../models/index";

export function login(loginName: string, password: string) {
  return request<{ token: string }>("/Auth/login", "POST", {
    body: { login: loginName, password },
  });
}

export function register(email: string, nick: string, password: string) {
  return request<string>("/Auth/register", "POST", {
    body: { email, nick, password },
  });
}

export function getMe(token: string) {
  return request<CurrentUser>("/Auth/me", "GET", { token });
}
