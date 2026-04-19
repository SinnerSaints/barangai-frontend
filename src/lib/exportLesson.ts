import { LessonRecord } from "./lessonProgress";

export function exportLessonAsHTML(lesson: LessonRecord) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${lesson.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0a0a0a;
      color: #e4e4e7;
      min-height: 100vh;
      padding: 2rem 1rem;
    }
    .container {
      max-width: 780px;
      margin: 0 auto;
    }
    .badge {
      display: inline-block;
      background: #1f2e1f;
      color: #8CD559;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.3rem 0.9rem;
      border-radius: 999px;
      margin-bottom: 1.2rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    h1 {
      font-size: 2rem;
      font-weight: 800;
      line-height: 1.25;
      margin-bottom: 1rem;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      font-size: 0.85rem;
      color: #a1a1aa;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #27272a;
    }
    .meta span { display: flex; align-items: center; gap: 0.4rem; }
    .content {
      font-size: 1rem;
      line-height: 1.85;
      color: #d4d4d8;
      white-space: pre-wrap;
    }
    .footer {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid #27272a;
      font-size: 0.75rem;
      color: #52525b;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">${lesson.topic}</div>
    <h1>${lesson.title}</h1>
    <div class="meta">
      <span>📚 ${lesson.total_lessons} Lessons</span>
      <span>📝 ${lesson.total_quizzes} Quizzes</span>
      <span>📅 Saved on ${new Date().toLocaleDateString()}</span>
      ${typeof lesson.score === "number" ? `<span>⭐ Score: ${lesson.score}%</span>` : ""}
    </div>
    <div class="content">${lesson.content ?? "No content available."}</div>
    <div class="footer">
      Saved from BarangAI · Open this file in any browser to read offline
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${lesson.title.replace(/[^a-z0-9]/gi, "_")}.html`;
  a.click();
  URL.revokeObjectURL(url);
}