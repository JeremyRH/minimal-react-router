import { PathURL } from "./utils/PathURL";

export type RouterMethod = (url: string) => Promise<void>;
export type UseRoutesResult = [any, { parameters: string[]; path: PathURL }];

export interface MatchedRoute {
  parameters: string[];
  path: PathURL;
  redirect: RouterMethod;
}

export interface ProcessedRoute {
  path: string;
  regExpPath: RegExp;
  resolve: Routes["route"];
}

export interface ResolvedRoute {
  parameters: string[];
  path: PathURL;
  result: any;
}

export interface Router {
  push: RouterMethod;
  replace: RouterMethod;
  useRoutes: (routes: Routes) => UseRoutesResult;
}

export interface Routes {
  [route: string]: (route: MatchedRoute) => any;
}

export interface RouterInternalState {
  currentRouteToken: symbol;
  initialState: ResolvedRoute;
  redirectStack: string[];
  routeResolvers: Record<string, ((url: string) => Promise<boolean>) | null> &
    // eslint-disable-next-line @typescript-eslint/ban-types
    Object;
  url: string;
}
