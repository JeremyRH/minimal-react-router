import { PathURL } from "./PathURL";
import {
  arraysMatch,
  getCaptureGroups,
  ProcessedRoute,
  ResolvedRoute,
  RouterInternalState,
  RouterMethod
} from "./routerUtils";

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
      // Return a promise that never resolves to effectively cancel it.
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
