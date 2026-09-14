# BearOps v1.1

Mobile-first work command centre for tasks, deadlines, follow-ups and bottlenecks.

## What changed in v1.1

- New premium gold/black BearOps logo used in the app and PWA icons.
- Fresh installs are preloaded with the current work list derived from the 9 September 2026 notes plus older unresolved carry-forward items where no completion was recorded.
- Manta, David and Kerri are permanent Waiting On choices and are always visible in the bottleneck view, including when their count is zero.
- Current work list can be reloaded from More > Data.
- Ambiguous handwritten items are clearly marked as clarification tasks rather than guessed.
- Existing local BearOps task data is preserved when updating the files.

## GitHub Pages update

Replace the files in the root of the existing `bearops` repository with the contents of this package and commit to `main`. GitHub Pages should redeploy automatically.

The service-worker cache was bumped to `bearops-v1.1.0`. After GitHub finishes deploying, close and reopen the installed app. If an old screen remains cached, refresh the page once in Chrome.

## First run / current list

On a fresh browser install, BearOps automatically loads the current work list. If an older BearOps installation already has locally stored tasks, those tasks are deliberately left untouched. Use **More > Data > Load current work list** only if you want to replace the existing local list with the supplied current list.

## Reminder limitation

GitHub Pages is static hosting. BearOps can check browser notifications while it is active, but guaranteed background reminders when the app is fully closed will require a later push service or calendar integration.
