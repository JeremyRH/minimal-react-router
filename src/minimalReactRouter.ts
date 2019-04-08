import { useCallback, useEffect, useMemo } from "react";
import { PathURL } from "./utils/PathURL";
import {
  processRoutes,
  ResolvedRoute,
  resolveRouteAction,
  Router,
  RouterInternalState,
  Routes
} from "./utils/routerUtils";
import { useStateActions } from "./utils/useStateActions";

// window.history object for browsers. Would be a custom object for node.
interface URLHistory {
  pushState: typeof History.prototype.pushState;
  replaceState: typeof History.prototype.replaceState;
}

// Sets the route for a specific router instance. internalState and historyFn should be bound arguments.
function setRoute(
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
  let anyMatch = false;
  return Array.from(internalState.routeResolvers)
    .reduce((sequence, resolveRoute) => {
      // Resolve route resolvers sequentially because they can change state and effect the result of the next resolver.
      return sequence
        .then(() => {
          return internalState.routeResolvers.has(resolveRoute)
            ? resolveRoute(url)
            : false;
        })
        .then(hasMatch => {
          anyMatch = anyMatch || hasMatch;
        });
    }, Promise.resolve())
    .then(() => {
      if (!anyMatch) {
        throw new Error(`Cound not find a matching route for: "${url}"`);
      }
    });
}

// Sets a route group and returns a result from the routes.
function useRoutesFn(
  internalState: RouterInternalState,
  routerReplace: Router["replace"],
  routes: Routes
): ResolvedRoute {
  const processedRoutes = useMemo(() => processRoutes(routes), [routes]);
  const initialState: ResolvedRoute = {
    parameters: [],
    path: new PathURL(internalState.url),
    result: null
  };
  const [resolvedRoute, resolveRouteFn] = useStateActions(
    initialState,
    resolveRouteAction
  );
  const resolveRoute = useCallback(
    resolveRouteFn.bind(null, internalState, routerReplace, processedRoutes),
    [resolveRouteFn, internalState, routerReplace, processedRoutes]
  );

  // Adding resolver to the internal state synchronously because they are resolved in order.
  if (!internalState.routeResolvers.has(resolveRoute)) {
    internalState.routeResolvers.add(resolveRoute);
  }

  // Render initial route when component mounts or route definitions update.
  useEffect(() => {
    resolveRoute(internalState.url);
  }, [internalState, resolveRoute]);

  // Remove route group if component will unmount or route definitions update.
  useEffect(
    () => () => {
      internalState.routeResolvers.delete(resolveRoute);
    },
    [internalState, resolveRoute]
  );

  return resolvedRoute;
}

export function createRouter(
  urlHistory: URLHistory,
  initialURL: string
): Router {
  const internalState: RouterInternalState = {
    redirectStack: [],
    routeResolvers: new Set(),
    url: initialURL
  };
  const push = setRoute.bind(
    null,
    internalState,
    urlHistory.pushState.bind(urlHistory)
  );
  const replace = setRoute.bind(
    null,
    internalState,
    urlHistory.replaceState.bind(urlHistory)
  );
  const useRoutes = useRoutesFn.bind(null, internalState, replace);
  return {
    push,
    replace,
    useRoutes
  };
}
