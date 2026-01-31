import { createApiClient } from "@libs/shared"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost"

export const api = createApiClient(API_BASE_URL)
