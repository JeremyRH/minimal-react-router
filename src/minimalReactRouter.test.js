/* eslint-disable no-console */
import React from "react";
import ReactDOM from "react-dom";
import { createRouter } from "./minimalReactRouter";
import { cleanup, render, waitForElement, wait } from "react-testing-library";

afterEach(cleanup);

test("can create router", () => {
  expect(createRouter(window.history, "/")).toBeTruthy();
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
  const { asFragment, getByText } = render(<App />);
  await waitForElement(() => getByText("1"));
  expect(asFragment()).toMatchInlineSnapshot(`
        <DocumentFragment>
          <div>
            1
          </div>
        </DocumentFragment>
    `);
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
  const { asFragment, getByText } = render(<App />);
  await waitForElement(() => getByText("foo"));
  expect(asFragment()).toMatchInlineSnapshot(`
    <DocumentFragment>
      <div>
        foo
      </div>
    </DocumentFragment>
  `);
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
