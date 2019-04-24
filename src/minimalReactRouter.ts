import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Router,
  RouterInternalState,
  RouterMethod,
  Routes,
  UseRoutesResult
} from "./types";
import { PathURL } from "./utils/PathURL";
import { resolveRouteAction } from "./utils/resolveRouteAction";
import { processRoutes, resolveLatest } from "./utils/routerUtils";
import { useStateActions } from "./utils/useStateActions";

// window.history object for browsers. Would be a custom object for SSR.
interface URLHistory {
  pushState: typeof History.prototype.pushState;
  replaceState: typeof History.prototype.replaceState;
}

// Sets the route for a router instance.
const [setRoute] = resolveLatest(async function setRoute(
  internalState: RouterInternalState,
  historyFn:
    | typeof History.prototype.pushState
    | typeof History.prototype.replaceState,
  url: string
): Promise<void> {
  // Only set the route if it has changed.
  if (!new PathURL(url).matches(internalState.url)) {
    historyFn(null, "", url);
  }
  const { routeResolvers } = internalState;
  let anyMatch = false;
  for (let resolverKey of Object.getOwnPropertySymbols(routeResolvers)) {
    internalState.currentRouteToken = resolverKey;
    const resolveRoute = routeResolvers[(resolverKey as unknown) as string];
    if (resolveRoute) {
      const status = await resolveRoute(url);
      if (status === undefined) {
        return;
      }
      anyMatch = anyMatch || status;
    }
  }
  if (!anyMatch) {
    throw new Error(`Cound not find a matching route for: "${url}"`);
  }
});

// Sets a route group and returns a result from the routes.
function useRoutesFn(
  internalState: RouterInternalState,
  routerReplace: RouterMethod,
  routes: Routes
): UseRoutesResult {
  const { initialState, routeResolvers } = internalState;
  const processedRoutes = useMemo(() => processRoutes(routes), [routes]);
  const [resolvedRoute, resolveRouteFn] = useStateActions(
    initialState,
    resolveRouteAction
  );
  const resolveRoute = useCallback(
    resolveRouteFn.bind(null, internalState, processedRoutes, routerReplace),
    [resolveRouteFn, internalState, processedRoutes, routerReplace]
  );
  const resolverKey = useRef(Symbol()).current;
  // Add route resolver placeholder to internalState to ensure iteration order of object keys when resolving routes.
  if (!routeResolvers.hasOwnProperty(resolverKey)) {
    routeResolvers[(resolverKey as unknown) as string] = null;
  }
  useEffect(() => {
    routeResolvers[(resolverKey as unknown) as string] = resolveRoute;
    return () => {
      delete routeResolvers[(resolverKey as unknown) as string];
    };
  }, [routeResolvers, resolveRoute, resolverKey]);
  // Resolve initial route when component mounts.
  useEffect(() => {
    internalState.currentRouteToken = resolverKey;
    resolveRoute(internalState.url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { parameters, path, result } = resolvedRoute;
  return [result, { parameters, path }];
}

export function createRouter(
  urlHistory: URLHistory,
  initialURL: string,
  defaultResult?: any
): Router {
  if (
    !urlHistory ||
    typeof urlHistory.pushState !== "function" ||
    typeof urlHistory.replaceState !== "function"
  ) {
    throw new TypeError(`Failed to create router: invalid History object`);
  }
  if (typeof initialURL !== "string") {
    throw new TypeError(`Failed to create router: invalid inital URL`);
  }
  const internalState: RouterInternalState = {
    currentRouteToken: Symbol(),
    initialState: {
      parameters: [],
      path: new PathURL(initialURL),
      result: defaultResult
    },
    redirectStack: [],
    routeResolvers: {},
    url: initialURL
  };
  const pushState = urlHistory.pushState.bind(urlHistory);
  const replaceState = urlHistory.replaceState.bind(urlHistory);
  const push = setRoute.bind(null, internalState, pushState);
  const replace = setRoute.bind(null, internalState, replaceState);
  const useRoutes = useRoutesFn.bind(null, internalState, replace);
  return {
    push,
    replace,
    useRoutes
  };
}
