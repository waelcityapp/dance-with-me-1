# CityEve / Dance with Me 1 — Project Rules

Repository: `waelcityapp/dance-with-me-1`

## Branches and publishing

- Work and preview branch: `ai-studio-cityeve`.
- Production branch: `main`.
- Start every new change by inspecting both branches.
- Make and test every change on `ai-studio-cityeve` first.
- Do not modify, merge into, or push to `main` unless the user says exactly: `ارفع على الرئيسية`.
- When the user approves a production update, transfer only the newly approved change(s), not the work branch history.
- Before a production transfer, report: file names, file count, additions/deletions, what will change, what will not change, and conflicts or risks.

## Before and after changes

- Before implementation, state briefly which files will change.
- After implementation, test the preview on desktop and mobile sizes, including Arabic RTL and English LTR, plus light and dark modes when the affected UI supports them.
- Run the build test before reporting completion.
- Do not delete old code without inspecting it and telling the user.

## Protected areas

Do not change any of the following without a clear user request:

- Banner background, including dancer imagery.
- Existing data.
- Firebase, storage, or any established integration/connection.
- Vercel, Cloudinary, or production deployment configuration.

## Product and page design

- Prefer independent pages with clear, shareable URLs for important areas instead of modal or popup screens.
- Public pages, such as events, categories, and cities, should be crawlable and indexable by Google.
- Private pages, such as login, account, and wallet, should have URLs but must not be indexable by Google.
- Support desktop and all mobile sizes, light/dark modes, Arabic RTL, and English LTR.

## GitHub access

- Use the integrated GitHub connection for remote repository work when available.
- Do not ask to reconnect existing integrations unless an actual authorization error blocks the requested work.
