import React from "react";
import { useRouter } from "./minimalReactRouter";

test("Foo", () => {
  const Component = (): JSX.Element => <div>{useRouter()}</div>;
  expect(<Component />).toMatchInlineSnapshot(`<Component />`);
});
