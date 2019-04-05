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

type NavigationFunction = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  title: string,
  url?: string | null | undefined
) => void;

interface Navigation {
  pushState: NavigationFunction;
  replaceState: NavigationFunction;
}

function setRoute(
  internalState: RouterInternalState,
  navigationFn: NavigationFunction,
  url: string
): Promise<void> {
  if (!new PathURL(url).matches(internalState.url)) {
    navigationFn(null, "", url);
  }
  let anyMatch = false;
  return Array.from(internalState.routeResolvers)
    .reduce((sequence, resolveRoute) => {
      // Resolve route actions sequentially because they can change state and effect the result of the next action.
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

  // Render initial route when component mounts or routes update.
  useEffect(() => {
    resolveRoute(internalState.url);
  }, [internalState, resolveRoute]);

  // Remove route group if component will unmount.
  useEffect(
    () => () => {
      internalState.routeResolvers.delete(resolveRoute);
    },
    [internalState, resolveRoute]
  );

  return resolvedRoute;
}

export function createRouter(
  navigation: Navigation,
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
    navigation.pushState.bind(navigation)
  );
  const replace = setRoute.bind(
    null,
    internalState,
    navigation.replaceState.bind(navigation)
  );
  const useRoutes = useRoutesFn.bind(null, internalState, replace);
  return {
    push,
    replace,
    useRoutes
  };
}
