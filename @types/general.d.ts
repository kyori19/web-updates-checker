declare module "web-updates-checker" {
  type InputCheckerOptions = {
    target_url: string,
  };

  type CheckerOptions = {
    targetUrl: URL,
  };

  type SaveResult = {
    files: string[],
    timestamp: number,
  };
}
