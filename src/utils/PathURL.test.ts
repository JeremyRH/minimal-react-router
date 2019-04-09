import { PathURL } from "./PathURL";

describe("PathURL", () => {
  test("creates a valid object from path", () => {
    const pathObj = new PathURL("/foo/bar?q=v#h");
    expect(pathObj.pathname).toBe("/foo/bar");
    expect(pathObj.searchParams).toBeInstanceOf(URLSearchParams);
    expect(pathObj.hash).toBe("#h");
  });

  test("gets a consistent pathname", () => {
    const pathObj1 = new PathURL("/foo/bar?q#h");
    const pathObj2 = new PathURL("/foo/bar/?a#b");
    expect(pathObj1.ensureFinalSlash()).toBe(pathObj2.ensureFinalSlash());
  });

  test("matches the same url", () => {
    const pathObj1 = new PathURL("/foo/bar");
    expect(pathObj1.matches("/foo/bar")).toBe(true);
    expect(pathObj1.matches("/foo/bar/")).toBe(true);
    const pathObj2 = new PathURL("/foo/bar?q#h");
    expect(pathObj2.matches("/foo/bar?q#h")).toBe(true);
    expect(pathObj2.matches("/foo/bar/?q#h")).toBe(true);
  });

  test("does not match a url unless all query params and hash match", () => {
    const pathObj = new PathURL("/foo/bar?q#h");
    expect(pathObj.matches("/foo/bar?q")).toBe(false);
    expect(pathObj.matches("/foo/bar#h")).toBe(false);
  });

  test("matches a PathURL object", () => {
    const pathObj1 = new PathURL("/foo/bar");
    const pathObj2 = new PathURL("/foo/bar");
    expect(pathObj1.matches(pathObj2)).toBe(true);
  });

  test("throws when matching invalid argument", () => {
    const pathObj = new PathURL("/foo/bar");
    expect(() => pathObj.matches(null)).toThrowError(TypeError);
  });

  test("returns a string of path + query + hash", () => {
    const pathObj = new PathURL(
      "https://user:pass@example.com:8000/foo/bar?q=v&a=b#h"
    );
    expect(pathObj.toString()).toBe("/foo/bar?q=v&a=b#h");
  });
});
