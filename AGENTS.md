# Project Release Workflow

- Treat a requested code change as incomplete until it has been built, committed, pushed, deployed, and verified, unless the user explicitly says not to perform one of those steps.
- Use the existing ordinary SSH alias `berry` for all remote work (`ssh berry` and `scp`). Do not use Codex's SSH Connections feature, install Codex on the Pi, or install additional deployment software unless the user explicitly requests it.
- Before releasing, inspect `git status` and the diff. Preserve unrelated user changes and stage only files that belong to the current task. Never force-push.

## Required release sequence

1. Run the relevant checks for the changed code.
2. Run the Angular production build with `npm run build`. Do not deploy if the build fails.
3. Commit the complete in-scope change with a clear commit message and push the current branch to `origin`.
4. Deploy every affected production component as described below. A frontend-only change still requires the frontend deployment; a Reqarr change requires both the frontend deployment when the UI depends on it and the Reqarr deployment.
5. Verify the deployed files/services and report the commit, push, build, deployment, and verification results.

## Frontend deployment

- The production build output is `dist/MyWebpage` and must contain `index.html` before deployment.
- The live web root on `berry` is `/var/www/html`.
- Copy the build to a temporary staging directory on `berry` first. Validate the resolved remote paths before any cleanup.
- Remove all existing contents inside `/var/www/html` (not the directory itself), then copy the complete contents of `dist/MyWebpage` into it. This replacement is required so obsolete hashed bundles cannot remain live.
- After copying, set directories under `/var/www/html` to mode `755` and files to mode `644` so nginx can traverse and read the deployed site.
- Keep the staging and cleanup commands narrowly scoped to the validated staging directory and `/var/www/html`; never use a broad or unresolved recursive target.
- Verify that `/var/www/html/index.html` exists and that the deployed asset filenames match the new production build.
- Verify the deployed site through nginx and through its public URL. Both `https://alinaeem.com/` and `https://www.alinaeem.com/` must finish with HTTP `200`; redirects are acceptable only when the final response is `200`.

## Reqarr deployment

- Reqarr source lives in the repository's `reqarr` directory and on `berry` at `/opt/media-stack/reqarr`.
- When any file under `reqarr` changes, copy all repository-owned Reqarr files through a temporary staging directory and replace their deployed counterparts. Preserve deployment-owned files that are not tracked in this repository, especially `/opt/media-stack/reqarr/Dockerfile`, then run `cd /opt/media-stack && docker compose up -d --build reqarr`.
- Verify with `docker compose ps reqarr` and inspect recent Reqarr logs for startup errors. Do not report the deployment complete if the container is unhealthy or restarting.

## Failure handling

- If SSH, build, push, copy, restart, or verification fails, stop the release at the failed step, preserve the current working tree and live service where possible, and report the exact blocker.
- Do not silently skip deployment, commit/push, or verification. If a step is intentionally unnecessary, state why in the final response.
