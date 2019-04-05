import { PathURL } from "./PathURL";

export type RouterMethod = (url: string) => Promise<void>;

export interface MatchedRoute {
  parameters: string[];
  path: PathURL;
  redirect: RouterMethod;
}

export interface Routes {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [route: string]: (route: MatchedRoute) => any;
}

export interface ProcessedRoute {
  path: string;
  regExpPath: RegExp;
  resolve: Routes["route"];
}

export interface ResolvedRoute {
  parameters: string[];
  path: PathURL;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any;
}

export interface Router {
  push: RouterMethod;
  replace: RouterMethod;
  useRoutes: (routes: Routes) => ResolvedRoute;
}

export interface RouterInternalState {
  redirectStack: string[];
  routeResolvers: Set<(url: string) => Promise<boolean>>;
  url: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  return RegExp(`^${formattedPath}${needsFinalSlash ? "/" : ""}$`);
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
    return {
      path,
      regExpPath: getRegExpPath(path),
      resolve
    };
  });
}

export function resolveRouteAction(
  setState: (newState: ResolvedRoute) => void,
  getState: () => ResolvedRoute,
  internalState: RouterInternalState,
  routerReplace: RouterMethod,
  processedRoutes: ProcessedRoute[],
  url: string
): Promise<boolean> {
  const pathURL = new PathURL(url);
  const matchedRoute = processedRoutes.find(({ regExpPath }) =>
    regExpPath.test(pathURL.ensureFinalSlash())
  );
  if (!matchedRoute) {
    return Promise.resolve(false);
  }
  let redirectCalled = false;
  const redirect = (redirectURL: string): Promise<void> => {
    redirectCalled = true;
    internalState.redirectStack.push(url);
    if (internalState.redirectStack.length >= 10) {
      throw new Error(
        `Exceeded redirect limit.\n${internalState.redirectStack.join(" -> ")}`
      );
    }
    return routerReplace(redirectURL);
  };
  const parameters = getCaptureGroups(matchedRoute.regExpPath, url);
  return Promise.resolve(
    matchedRoute.resolve({ parameters, path: pathURL, redirect })
  ).then(result => {
    if (redirectCalled) {
      return new Promise(() => {});
    }
    const prevState = getState();
    const isSameState =
      Object.is(result, prevState.result) &&
      pathURL.matches(prevState.path) &&
      arraysMatch(parameters, prevState.parameters);
    if (!isSameState) {
      setState({ parameters, path: pathURL, result });
    }
    internalState.url = url;
    internalState.redirectStack.length = 0;
    return true;
  });
}