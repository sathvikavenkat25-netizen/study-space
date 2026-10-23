# StudySpot AI

**Know what to study. Know where to study.**

StudySpot AI is a mobile-first, single-page study-planning demo. It runs in the browser without a backend, build step, or JavaScript dependencies.

## Features

- Exam planner with exam countdowns and topic lists
- Topic priority suggestions based on mastery and exam proximity
- Simple timetable generator with 1–4–7 spaced revision reminders
- Topic confidence assessments that update mastery scores
- Sample campus study spaces with search and filters
- Demo four-step check-in flow
- Study-time tracking, streak, weekly chart, and syllabus coverage
- Light and dark themes
- Separate local profiles by student ID

## Run locally

Open `index.html` in a browser, or start a local server from this folder:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Deploy with GitHub Pages

1. Create a GitHub repository, for example `StudySpot-AI`.
2. Upload `index.html`, `style.css`, `app.js`, `README.md`, and `LICENSE` to the repository root.
3. Open **Settings → Pages**.
4. Under build and deployment, select **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then save.
6. Wait for the deployment to finish. The site URL will look like `https://YOUR-USERNAME.github.io/StudySpot-AI/`.

## Project structure

```text
StudySpot-AI/
├── index.html
├── style.css
├── app.js
├── README.md
└── LICENSE
```

## Important demo limitations

- Data is stored in `localStorage` on the current browser/device and does not sync.
- Student IDs are local profile labels, not real accounts.
- Do not use real passwords. The check-in password step is only a demo and does not authenticate a student.
- Camera and location steps are simulated. No face recognition or actual geofence check is performed.
- Study-space availability and seat counts are sample estimates, not live sensor data.
- Sample study spaces are placeholders and should be updated for your campus.
- The timetable is a simple planning aid, not an optimized scheduling engine.

## Customization

- Edit the sample study-space list in `app.js` (`sampleSpaces`).
- Update colors, typography, spacing, and responsive layouts in `style.css`.
- Add real exam subjects and topics through the app's Exam planner.

## License

MIT. See `LICENSE`.
