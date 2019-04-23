import { ProcessedRoute, Routes } from "../types";
import { PathURL } from "./PathURL";

export function arraysMatch(firstArr: any[], ...arrays: any[][]): boolean {
  return (
    arrays.length > 0 &&
    arrays.every(arr => {
      return (
        arr.length === firstArr.length &&
        arr.every((item, i) => Object.is(item, firstArr[i]))
      );
    })
  );
}

// Always gets an array containing only string captured groups from RegExp.prototype.exec.
export function getCaptureGroups(regExp: RegExp, url: string): string[] {
  const match = regExp.exec(new PathURL(url).ensureFinalSlash());
  return match
    ? match.filter((matched, i) => i !== 0 && typeof matched === "string")
    : [];
}

export function getRegExpPath(pathname: string): RegExp {
  const formattedPath = pathname.replace(/:\w+|[$^*()+[\]|\\.?]/g, match => {
    // Capture group: "/foo/:bar/baz" -> "/foo/([^/]+)/baz"
    if (match.startsWith(":")) {
      return "([^/]+)";
    }
    // Make "*" a wildcard.
    else if (match === "*") {
      return ".*";
    }
    // Remove escape characters.
    else if (match === "\\") {
      return "";
    }
    // Escape special characters.
    else {
      return "\\" + match;
    }
  });
  // Paths ending in a wildcard or slash don't need an aditional trailing slash.
  const needsFinalSlash = !pathname.endsWith("*") && !pathname.endsWith("/");
  return RegExp(`^${formattedPath}${needsFinalSlash ? "/" : ""}$`, "i");
}

export function processRoutes(routes: Routes): ProcessedRoute[] {
  return Object.entries(routes).map(([path, resolve]) => {
    const isValidPath =
      path.startsWith("/") && !path.includes("?") && !path.includes("#");
    if (!isValidPath) {
      throw new TypeError(
        `Invalid path: "${path}"\nValid paths must begin with a "/" and cannot include query params or hashes.`
      );
    }
    if (typeof resolve !== "function") {
      throw new TypeError(`Resolver for path: "${path}" is not a function.`);
    }
    return {
      path,
      regExpPath: getRegExpPath(path),
      resolve
    };
  });
}

export function resolveLatest<T extends any[], U>(
  ...asyncFns: ((...args: T) => Promise<U>)[]
): ((...args: T) => Promise<U>)[] {
  let token: symbol;
  return asyncFns.map(
    asyncFn =>
      function(...args) {
        const storedToken = (token = Symbol());
        return asyncFn(...args).then(value => {
          if (storedToken === token) {
            return value;
          }
          return new Promise(() => {});
        });
      }
  );
}
