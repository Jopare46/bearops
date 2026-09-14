# BearOps

A mobile-first work command centre for tasks, deadlines, follow-ups and bottlenecks.

## GitHub Pages setup

1. Create a new GitHub repository named `bearops`.
2. Upload all files in this folder to the repository root.
3. In GitHub open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch **main** and folder **/(root)**, then save.
6. Open `https://YOUR-USERNAME.github.io/bearops/`.
7. On Android Chrome, use **Add to Home screen** / **Install app**.

## Version 1 features

- Today dashboard
- Priority queue / "Build my day"
- Deadlines and overdue tasks
- Waiting-on workflow with Manta / David / Kerri and other bottlenecks
- Chase dates
- Recurring daily / weekly / monthly tasks
- Quick Add text parsing
- Project grouping
- Local reminder checks while BearOps is open
- Browser notifications while the app is active
- Local backup export / import
- Work-summary generator for sharing with ChatGPT
- Offline PWA cache

## Important reminder limitation

GitHub Pages is static hosting. Browser notifications cannot be relied on to wake the app at a future time when it is fully closed. BearOps checks and fires reminders while it is open/active. Guaranteed background push reminders will require a future push service or calendar integration.
