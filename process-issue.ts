import {Octokit} from "@octokit/rest";
import unified from "unified";
import markdown from "remark-parse";
import {codeblocks} from "remark-code-blocks";
import YAML from "yaml";
import Git, {Enums} from "nodegit";
import fs from "fs";
import dedent from "dedent-js";

import {saveToFile, inputToOptions, optionsToInput} from "./general";
import DIRECTION = Enums.DIRECTION;

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN as string,
  userAgent: "web-updates-checker",
});

(async () => {
  const { data: repo } = await octokit.repos
    .get({
      owner: process.env.REPOSITORY_OWNER as string,
      repo: process.env.REPOSITORY_NAME as string,
    });

  const { data: issue } = await octokit.issues
    .get({
      owner: process.env.REPOSITORY_OWNER as string,
      repo: process.env.REPOSITORY_NAME as string,
      issue_number: parseInt(process.env.ISSUE_NUMBER as string),
    });

  const blocks = codeblocks(unified().use(markdown).parse(issue.body)).codeblocks;
  const yaml = (blocks["yaml"] || []).concat(blocks["yml"] || []).join("\n");

  const options = inputToOptions(YAML.parse(yaml));

  const repository = await Git.Repository.open(".");
  const branchName = `updates-checker/${issue.number}`;
  await repository.getBranchCommit(repo.default_branch)
    .then((commit) => repository.createBranch(branchName, commit))
    .then((branch) => repository.checkoutBranch(branch));

  const targetDir = `sites/${issue.number}`;
  fs.mkdirSync(targetDir, { recursive: true });
  const { files, timestamp: now } = await saveToFile(targetDir, options);

  const committer = Git.Signature.now("GitHub Actions", "actions@github.com");
  await repository.createCommitOnHead(
    files,
    committer,
    committer,
    `Initial state @ ${now}`
  );

  const remote = await Git.Remote.create(repository, "github", `https://${process.env.GITHUB_ACTOR}:${process.env.GITHUB_TOKEN}@github.com/${process.env.GITHUB_REPOSITORY}.git`);
  await remote.connect(DIRECTION.PUSH, {})
    .then(_ => remote.push([`refs/heads/${branchName}:refs/heads/${branchName}`]));

  await octokit.pulls
    .create({
      owner: process.env.REPOSITORY_OWNER as string,
      repo: process.env.REPOSITORY_NAME as string,
      base: repo.default_branch,
      head: branchName,
      title: issue.title,
      body: dedent`
      This pull request is created by #${issue.number}.
      **You don't have to do anything with this pull request.**
      
      ## Configurations
      
      \`\`\`yaml
      ${YAML.stringify(optionsToInput(options))}
      \`\`\`
      `,
      maintainer_can_modify: true,
    });

  await octokit.issues
    .update({
      owner: process.env.REPOSITORY_OWNER as string,
      repo: process.env.REPOSITORY_NAME as string,
      issue_number: issue.number,
      state: "closed",
    });
})();
