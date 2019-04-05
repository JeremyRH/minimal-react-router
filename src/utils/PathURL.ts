// Path object similar to URL without host and protocol.
export class PathURL {
  public hash: string;
  public pathname: string;
  public searchParams: URLSearchParams;

  public constructor(url: string) {
    // Use 'file:' as a base becasue URL does not accept a path by itself.
    const urlObj = new URL(url, "file:");
    this.hash = urlObj.hash;
    this.pathname = urlObj.pathname;
    this.searchParams = urlObj.searchParams;
  }

  public ensureFinalSlash(): string {
    return this.pathname.endsWith("/") ? this.pathname : `${this.pathname}/`;
  }

  public matches(path: string | PathURL): boolean {
    const pathObj = typeof path === "string" ? new PathURL(path) : path;
    return (
      this.ensureFinalSlash() === pathObj.ensureFinalSlash() &&
      this.searchParams.toString() === pathObj.searchParams.toString() &&
      this.hash === pathObj.hash
    );
  }

  public toString(): string {
    return `${this.pathname}?${this.searchParams.toString()}${this.hash}`;
  }
}
