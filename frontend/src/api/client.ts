import type {
  Category,
  Difficulty,
  HealthResponse,
  Ingredient,
  Language,
  PagedResult,
  Recipe,
  RecipeCategory,
  RecipeMatch,
  RecipeSummary,
} from '@/api/types';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';
const REQUEST_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ProblemDetails {
  detail?: string;
  title?: string;
}

export interface MatchRecipesRequest {
  ingredients: string[];
  language: Language;
}

export interface GetRecipesParams {
  search?: string;
  category?: RecipeCategory;
  maxTime?: number;
  difficulty?: Difficulty;
  ingredient?: string;
  language?: Language;
  page?: number;
  pageSize?: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const problem = await readProblemDetails(response);
      throw new ApiError(response.status, problem.detail ?? problem.title ?? `Request failed with status ${response.status}`);
    }

    return readJson<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, 'Request timed out after 10 seconds.');
    }

    throw new ApiError(0, error instanceof Error ? error.message : 'Network request failed.');
  } finally {
    window.clearTimeout(timeout);
  }
}

async function readProblemDetails(response: Response): Promise<ProblemDetails> {
  try {
    const problem: unknown = await response.json();

    if (isRecord(problem)) {
      return {
        detail: typeof problem.detail === 'string' ? problem.detail : undefined,
        title: typeof problem.title === 'string' ? problem.title : undefined,
      };
    }
  } catch {
    // The status code remains available when the server does not return JSON.
  }

  return {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readJson<T>(response: Response): Promise<T> {
  return response.json();
}

function toQueryString(params: object): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' || typeof value === 'number') {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function matchRecipes(request: MatchRecipesRequest): Promise<RecipeMatch[]> {
  return requestJson<RecipeMatch[]>('/recipes/match', request);
}

export function getRecipes(params: GetRecipesParams = {}): Promise<PagedResult<RecipeSummary>> {
  return request<PagedResult<RecipeSummary>>(`/recipes${toQueryString(params)}`);
}

export function getRecipeBySlug(slug: string, ingredients?: string[]): Promise<Recipe> {
  const query = ingredients?.length
    ? `?ingredients=${encodeURIComponent(ingredients.join(','))}`
    : '';
  return request<Recipe>(`/recipes/${encodeURIComponent(slug)}${query}`);
}

export function getIngredients(): Promise<Ingredient[]> {
  return request<Ingredient[]>('/ingredients');
}

export function getCategories(): Promise<Category[]> {
  return request<Category[]>('/categories');
}

async function requestJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function checkHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health');
}

