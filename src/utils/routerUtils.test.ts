import {
  arraysMatch,
  getCaptureGroups,
  getRegExpPath,
  processRoutes
} from "./routerUtils";

describe("arraysMatch", () => {
  test("returns false with one array", () => {
    expect(arraysMatch([1])).toBe(false);
  });

  test("matches empty arrays", () => {
    expect(arraysMatch([], [])).toBe(true);
  });

  test("matches array items", () => {
    expect(arraysMatch([1, 2], [1, 2])).toBe(true);
  });

  test("fails to match different items", () => {
    expect(arraysMatch([1, 2], [2, 1])).toBe(false);
  });

  test("fails to match different length arrays", () => {
    expect(arraysMatch([1, 2], [1, 2, 2])).toBe(false);
  });

  test("matches more than two arrays", () => {
    expect(arraysMatch([1, 2, 3], [1, 2, 3], [1, 2, 3])).toBe(true);
  });
});

describe("getCaptureGroups", () => {
  test("returns captured groups", () => {
    expect(getCaptureGroups(/\/(.+)\/(.+)\//, "/foo/bar")).toEqual([
      "foo",
      "bar"
    ]);
  });

  test("matches only on paths", () => {
    const href = "http://localhost/foo/bar?query#hash";
    expect(getCaptureGroups(/\/(.+)\/(.+)\//, href)).toEqual(["foo", "bar"]);
  });

  test("returns empty array", () => {
    // RegExp does not match
    expect(getCaptureGroups(/(baz)/, "/foo/bar")).toEqual([]);
    // RegExp has no capture groups
    expect(getCaptureGroups(/.*/, "/foo/bar")).toEqual([]);
    // Capture group paths are not taken
    expect(getCaptureGroups(/foo|(baz)/, "/foo/bar")).toEqual([]);
  });

  test("keeps empty strings", () => {
    expect(getCaptureGroups(/\/(foo)\/(.*)bar/, "/foo/bar")).toEqual([
      "foo",
      ""
    ]);
  });
});

describe("getRegExpPath", () => {
  test("converts simple paths to RegExp", () => {
    expect(getRegExpPath("/")).toEqual(/^\/$/i);
    expect(getRegExpPath("/path/foo")).toEqual(/^\/path\/foo\/$/i);
  });

  test("converts wildcards to .*", () => {
    expect(getRegExpPath("/path/*/bar")).toEqual(/^\/path\/.*\/bar\/$/i);
    expect(getRegExpPath("/path/*/bar/*")).toEqual(/^\/path\/.*\/bar\/.*$/i);
  });

  test("handles trailing slashes", () => {
    expect(getRegExpPath("/path")).toEqual(/^\/path\/$/i);
    // Does not add a trailing slash when there is one already
    expect(getRegExpPath("/path/")).toEqual(/^\/path\/$/i);
    // Wildcards at the end of a path shouldn't have a trailing slash
    expect(getRegExpPath("/path/*")).toEqual(/^\/path\/.*$/i);
  });

  test("handles special characters", () => {
    expect(getRegExpPath("/`~!@#$%^&()-=+[{]}\\|;'\",<.>?`/")).toEqual(
      /^\/`~!@#\$%\^&\(\)-=\+\[{\]}\|;'",<\.>\?`\/$/i
    );
  });

  test("converts capture groups", () => {
    expect(getRegExpPath("/path/:foo/bar")).toEqual(
      /^\/path\/([^/]+)\/bar\/$/i
    );
    expect(getRegExpPath("/path/:1/:2_")).toEqual(
      /^\/path\/([^/]+)\/([^/]+)\/$/i
    );
  });
});

describe("processRoutes", () => {
  test("processes valid routes", () => {
    const resolve = (): void => {};
    const pRoutes = processRoutes({ "/": resolve });
    expect(pRoutes[0]).toEqual({ path: "/", resolve, regExpPath: /^\/$/i });
  });

  test("errors with invalid routes", () => {
    // Missing first slash in path
    expect(() => processRoutes({ path: () => {} })).toThrow(TypeError);
    // Query param in path
    expect(() => processRoutes({ "/path?q": () => {} })).toThrow(TypeError);
    // Resolver is not a function
    expect(() => processRoutes({ "/": null })).toThrow(TypeError);
  });
});
