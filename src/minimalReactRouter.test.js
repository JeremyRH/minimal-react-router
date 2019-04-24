/* eslint-disable no-console */
import React from "react";
import ReactDOM from "react-dom";
import { createRouter } from "./minimalReactRouter";
import { cleanup, render, waitForElement, wait } from "react-testing-library";

function makeLazy(Component) {
  return React.lazy(
    () => new Promise(r => setTimeout(r, 100, { default: Component }))
  );
}

afterEach(cleanup);

test("can create router", () => {
  expect(createRouter(window.history, "/")).toMatchInlineSnapshot(`
    Object {
      "push": [Function],
      "replace": [Function],
      "useRoutes": [Function],
    }
  `);
});

test("can return result from matching route", async () => {
  const router = createRouter(window.history, "/one");
  const routes = {
    "/one": () => <div>1</div>,
    "/two": () => <div>2</div>
  };
  function App() {
    const [component = null] = router.useRoutes(routes);
    return component;
  }
  const { getByText } = render(<App />);
  await waitForElement(() => getByText("1"));
});

test("can return result from multiple routes", async () => {
  const router = createRouter(window.history, "/foo");
  const fooRoutes = { "/foo": () => <div>foo</div> };
  function Foo() {
    const [component = null] = router.useRoutes(fooRoutes);
    return component;
  }
  const appRoutes = { "/foo": () => Foo };
  function App() {
    const [Component = () => null] = router.useRoutes(appRoutes);
    return <Component />;
  }
  const { getByText } = render(<App />);
  await waitForElement(() => getByText("foo"));
});

test("returns correct result from routes with wildcard", async () => {
  const router = createRouter(window.history, "/foo");
  const routes = {
    "/foo": () => <div>foo</div>,
    "/*": () => <div>wildcard</div>
  };
  function App() {
    const [component = null] = router.useRoutes(routes);
    return component;
  }
  const { getByText } = render(<App />);
  await waitForElement(() => getByText("foo"));
});

test("can navigate to new route", async () => {
  const router = createRouter(window.history, "/");
  const routes = {
    "/foo": () => <div>foo</div>,
    "/*": () => <div>wildcard</div>
  };
  function App() {
    const [component = null] = router.useRoutes(routes);
    return component;
  }
  const { getByText } = render(<App />);
  router.push("/foo");
  await waitForElement(() => getByText("foo"));
});

test("does not call setState on unmounted route", async () => {
  const router = createRouter(window.history, "/foo");
  const routes = { "/foo": () => <div>foo</div> };
  function Foo() {
    const [component = null] = router.useRoutes(routes);
    return component;
  }
  const { container } = render(<Foo />);
  console.error = jest.fn(console.error);
  ReactDOM.unmountComponentAtNode(container);
  await wait(() => {
    expect(
      console.error.mock.calls.find(([message]) =>
        message.includes("unmounted component")
      )
    ).toBe(undefined);
    console.error.mockRestore();
  });
});

test("can lazy-load routes", async () => {
  const LazyFoo = makeLazy(() => <div>foo</div>);
  const Default = () => <div>default</div>;
  const Wildcard = () => <div>wildcard</div>;
  const router = createRouter(window.history, "/", Default);
  const routes = {
    "/foo": () => LazyFoo,
    "/*": () => Wildcard
  };
  function App() {
    const [Component] = router.useRoutes(routes);
    React.useEffect(() => {
      setTimeout(() => router.push("/foo"), 100);
    }, []);
    return (
      <React.Suspense fallback={<div>loading</div>}>
        <Component />
      </React.Suspense>
    );
  }
  const { getByText } = render(<App />);
  await waitForElement(() => getByText("default"));
  await waitForElement(() => getByText("wildcard"));
  await waitForElement(() => getByText("loading"));
  await waitForElement(() => getByText("foo"));
});

test("can lazy-load lazy-loaded routes", async () => {
  const router = createRouter(window.history, "/foo/bar", () => (
    <div>default</div>
  ));
  const LazyFooBar = makeLazy(() => <div>foobar</div>);
  const RouteLoader = React.memo(function RouteLoader({ routes }) {
    const [Component] = router.useRoutes(routes);
    return (
      <React.Suspense fallback={<div>loading</div>}>
        <Component />
      </React.Suspense>
    );
  });
  const fooRoutes = {
    "/foo/bar": () => LazyFooBar
  };
  const appRoutes = {
    "/foo/*": () => makeLazy(() => <RouteLoader routes={fooRoutes} />)
  };
  function App() {
    return <RouteLoader routes={appRoutes} />;
  }
  const { getByText } = render(<App />);
  await waitForElement(() => getByText("default"));
  await waitForElement(() => getByText("loading"));
  await waitForElement(() => getByText("foobar"));
});

test("can redirect to new route", async () => {
  const router = createRouter(window.history, "/bar");
  const routes = {
    "/foo": () => <div>foo</div>,
    "/bar": ({ redirect }) => redirect("/foo")
  };
  function App() {
    const [component = null] = router.useRoutes(routes);
    return component;
  }
  const { getByText } = render(<App />);
  await waitForElement(() => getByText("foo"));
});

test("has path and parameters", async () => {
  const router = createRouter(window.history, "/a/b/c?q#h", null);
  const routes = {
    "/a/:bar/:baz": ({ path, parameters }) => {
      return ({ path: path2, parameters: parameters2 }) => {
        const stringValues = [
          path.toString(),
          path2.toString(),
          ...parameters,
          ...parameters2
        ];
        return <div>{stringValues.join()}</div>;
      };
    }
  };
  function App() {
    const [Component, props] = router.useRoutes(routes);
    return Component && <Component {...props} />;
  }
  const { getByText } = render(<App />);
  await waitForElement(() => getByText("/a/b/c?q=#h,/a/b/c?q=#h,b,c,b,c"));
});
