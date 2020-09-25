import {Octokit} from "@octokit/rest";
import {codeblocks} from "remark-code-blocks";
import unified from "unified";
import markdown from "remark-parse";
import {inputToOptions, saveToFile} from "./general";
import YAML from "yaml";
import Git, {Enums} from "nodegit";
import {promises as fs} from "fs";
import DIRECTION = Enums.DIRECTION;

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN as string,
  userAgent: "web-updates-checker",
});

(async () => {
  const { data: pullRequests } = await octokit.pulls
    .list({
      owner: process.env.REPOSITORY_OWNER as string,
      repo: process.env.REPOSITORY_NAME as string,
      state: "open",
    });

  await Promise.all(
    pullRequests.map(async ({ body, head }) => {
      const blocks = codeblocks(unified().use(markdown).parse(body)).codeblocks;
      const yaml = (blocks["yaml"] || []).concat(blocks["yml"] || []).join("\n");

      const options = inputToOptions(YAML.parse(yaml));

      const repository = await Git.Repository.open(".");
      await repository.getBranchCommit(`origin/${head.ref}`)
        .then((commit) => repository.createBranch(head.ref, commit))
        .then((branch) => repository.checkoutBranch(branch));

      const targetDir = await fs.readdir("sites")
        .then((files) => `sites/${files[0]}`);
      const { files, timestamp: now } = await saveToFile(targetDir, options);

      const committer = Git.Signature.now("GitHub Actions", "actions@github.com");
      await repository.createCommitOnHead(
        files,
        committer,
        committer,
        `Updated state @ ${now}`
      );

      const remote = await Git.Remote.create(repository, "github", `https://${process.env.GITHUB_ACTOR}:${process.env.GITHUB_TOKEN}@github.com/${process.env.GITHUB_REPOSITORY}.git`);
      await remote.connect(DIRECTION.PUSH, {})
        .then(_ => remote.push([`refs/heads/${head.ref}:refs/heads/${head.ref}`]));
    })
  );
})();
