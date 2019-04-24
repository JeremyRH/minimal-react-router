import {
  ProcessedRoute,
  ResolvedRoute,
  RouterInternalState,
  RouterMethod
} from "../types";
import { PathURL } from "./PathURL";
import { arraysMatch, getCaptureGroups } from "./routerUtils";

export async function resolveRouteAction(
  setState: (newState: ResolvedRoute) => void,
  getState: () => ResolvedRoute,
  internalState: RouterInternalState,
  processedRoutes: ProcessedRoute[],
  routerReplace: RouterMethod,
  url: string
): Promise<boolean> {
  const { currentRouteToken, redirectStack, routeResolvers } = internalState;
  const pathURL = new PathURL(url);
  const matchedRoute = processedRoutes.find(({ regExpPath }) =>
    regExpPath.test(pathURL.ensureFinalSlash())
  );
  if (!matchedRoute) {
    return false;
  }
  let redirectPromise: Promise<void> | null = null;
  const redirect = (redirectURL: string): Promise<void> => {
    redirectStack.push(url);
    if (redirectStack.length >= 10) {
      throw new Error(
        `Exceeded redirect limit.\n${redirectStack.join(" -> ")}`
      );
    }
    redirectPromise = routerReplace(redirectURL);
    return redirectPromise;
  };
  const parameters = getCaptureGroups(matchedRoute.regExpPath, url);
  const result = await matchedRoute.resolve({
    parameters,
    path: pathURL,
    redirect
  });
  if (redirectPromise !== null) {
    return redirectPromise;
  }
  // Component will unmount or has unmounted.
  if (!routeResolvers[(currentRouteToken as unknown) as string]) {
    return false;
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
  redirectStack.length = 0;
  return true;
}
