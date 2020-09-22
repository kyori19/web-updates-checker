import {InputCheckerOptions, CheckerOptions, SaveResult} from "web-updates-checker";
import fetch from "node-fetch";
import { promises as fs } from "fs";

export function inputToOptions(
  {
    target_url,
  }: InputCheckerOptions
): CheckerOptions {
  return {
    targetUrl: new URL(target_url),
  };
}

export function optionsToInput(options: CheckerOptions): InputCheckerOptions {
  return {
    target_url: options.targetUrl.href,
  };
}

export function saveToFile(dir: string, options: CheckerOptions): Promise<SaveResult> {
  const now = Math.floor(+ new Date() / 1000);
  const files = [
    `${dir}/${now}.html`,
    `${dir}/latest.html`,
  ];

  return fetch(options.targetUrl)
    .then((response) => response.text())
    .then((body) => Promise.all(files.map((path) => fs.writeFile(path, body))))
    .then(_ => ({ files, timestamp: now }));
}
