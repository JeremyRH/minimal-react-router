# minimal-react-router

`minimal-react-router` is a lightweight router for React with a small API.

Uses [React hooks](https://reactjs.org/docs/hooks-reference.html) and requires a peer dependency of `react >=16.8.0`.

## Installation

`npm install minimal-react-router`

## Example

```js
import { createRouter } from "minimal-react-router";

const router = createRouter(window.history, location.href);
const routes = {
  "/one": () => ComponentOne,
  "/two": () => ComponentTwo
};

function App() {
  // Routes are resolved async so the inital value is undefined.
  // Set a default value for the placeholder.
  const [Component = Spinner] = router.useRoutes(routes);
  return <Component />;
}
```

## API

### createRouter

```js
router = createRouter(urlHistory, initialURL)
```

Creates a router instance.

* `@param urlHistory` History object. Implements [pushState](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_pushState()_method) and [replaceState](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_replaceState()_method) methods.
* `@param initialURL` Initial URL string.
* `@returns router`

### router.useRoutes

```ts
[
  result,
  {
    parameters: string[],
    path: PathURL {}
  }
] = router.useRoutes(routes)
```

A custom React hook that takes a `routes` object and returns a result of the matching route.

* `@param routes` An object describing the routes.
* `@returns [result, { parameters, path }]`

### router.push

```js
router.push("/new/path")
```

Navigates to a new path and calls `urlHistory.pushState` internally.
Returns a promise that resolves when all currently loaded routes are resolved.

### router.replace

```js
router.replace("/replaced/path")
```

Replaces the current path and calls `urlHistory.replaceState` internally.
Returns a promise that resolves when all currently loaded routes are resolved.

## Objects

### Routes object

An object describing the routes.

```js
const routes = {
  "/one": () => ComponentOne,
  "/two": () => ComponentTwo
};
```

* Route paths must match absolute paths:
```js
"/foo/bar": () => Component
```
* Route paths cannot contain "?" or "#":
```js
"/foo?param#hash": () => Component // Error!
```
* If you need to use query params or hashes, use path:
```js
"/foo": ({ path }) => {
  // do something with path.searchParams or path.hash
}
```
* Route paths can capture path parts:
```js
"/foo/:param/:anotherParam": ({ parameters }) => {
  // path: "/foo/bar/baz" = parameters: ["bar", "baz"]
}
```
* Route paths support wildcards and match from top down:
```js
"/foo/*/": () => FooSomething,
"/foo/*": () => FooEverythingElse
```
* Resolvers can be sync or async:
```js
"/home": async () => await isAuthenticated() ? UserHome : Home
```
* Resolvers can redirect:
```js
"/oldhome": ({ redirect }) => redirect("/home")
```
* Resolvers have access to the path and params that were used to match:
```js
"/foo/:bar/:baz": ({ parameters, path }) => {
  path.toString() // "/foo/some/thing?q=1#hash"
  parameters // ["some", "thing"]
}
```

### PathURL object

A path object similar to [URL](https://developer.mozilla.org/en-US/docs/Web/API/URL) but only deals with paths, query parameters, and hashes.

Example:

```ts
{
  hash: "#hash",
  pathname: "/foo/bar",
  searchParams: URLSearchParams {},
  ensureFinalSlash: () => "/foo/bar/",

  // Case insensitive, final slash insensitive, compares pathname, query params, and hash.
  matches: (path: string | PathURL) => boolean,
  toString: () => "/foo/bar?queryParam=foo#hash"
}
```
