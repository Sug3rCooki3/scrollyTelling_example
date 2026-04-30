export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function url(pathname: string): string {
  const clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${basePath}${clean}`;
}
