import { createRouter } from "./minimalReactRouter";

test("can create router", () => {
  expect(createRouter(window.history, "/")).toBeTruthy();
});
