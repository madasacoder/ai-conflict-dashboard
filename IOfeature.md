Below is a clean, self-contained task list rewritten for clarity and consistency.
Every task now follows the exact same three-part structure:
	•	WHY – purpose / rationale
	•	PROMPT – copy-paste text for your AI coding assistant (includes Analyze → Act → Deliver)
	•	VALIDATION – how you (or CI) prove the work is complete

Use the tasks in order; each one assumes the previous task is already merged.

⸻

Task 1  — Centralized Configuration

Section	Content
WHY	One typed settings class prevents magic constants and makes limits tweakable via .env.
PROMPT	### Analyze 1. List the repo (`ls -R`); search for existing settings modules (e.g., config.py, settings.py). 2. If a Pydantic settings class exists, plan to **extend** it; otherwise create `app/config.py`. ### Act • Implement/extend a Pydantic `BaseSettings` class with:   - MAX_UPLOAD_MB = 50   - MAX_EXCEL_ROWS = 5000   - MAX_PDF_PAGES = 200   - UPLOAD_DIR = "./uploads" • Expose a singleton `settings`. • Emit / update `.env.example` commenting these vars. ### Deliver - File path(s) changed or created - Any new import lines needed elsewhere
VALIDATION	Run pytest tests/test_config.py – must: 1 import settings without error. 2 show default values when .env is absent. 3 override a var via a temp .env and reflect new value.


⸻

Task 2  — Secure Upload Endpoint + Virus Scan

Section	Content
WHY	Reject oversize / spoofed / malicious files before parsing.
PROMPT	### Analyze 1. Search for existing FastAPI routers (`grep -Ri "APIRouter("`). Choose one to extend or create `app/api/upload.py`. ### Act Build `/uploadfile/` that: • Streams upload; abort if > settings.MAX_UPLOAD_MB ⇒ HTTP 413. • Renames to UUID.ext; save in settings.UPLOAD_DIR. • Detects MIME via python-magic; reject on mismatch or not-whitelisted ⇒ 415. • Scans file with ClamAV (clamd); if infected, delete & return 403. • Responds JSON {id, original_name, mime, size_bytes}. • Logs structured JSON. ### Deliver - New/updated router file. - Ensure router is included in main app. - `tests/test_upload_and_scan.py` covering happy path, 413, 415, mocked virus.
VALIDATION	pytest tests/test_upload_and_scan.py passes and coverage for api/upload.py ≥ 90 %.


⸻

Task 3  — MIME Utility

Section	Content
WHY	Central helper for accurate MIME detection and whitelist/denylist checks.
PROMPT	### Analyze Search for utils modules. If a MIME helper exists, extend; else create `utils/mime.py`. ### Act • Implement `detect_mime(path) -> str` using python-magic-bin (Windows safe). • Implement `is_allowed_mime(mime:str) -> bool` referencing whitelist & denylist (may live in config). ### Deliver - Utility file path. - `tests/test_mime_detection.py` covering txt, pdf, xlsx, spoof mismatch.
VALIDATION	All tests green; spoof file returns False.


⸻

Task 4  — Parser Dispatcher

Section	Content
WHY	Keeps upload logic thin; adding formats only touches one map.
PROMPT	### Analyze Locate or create `app/parsers/`. ### Act In `app/parsers/__init__.py` implement: dispatch_to_parser(path, mime) mapping → • PDFs → pdf.parse_pdf • Excel → excel.parse_excel • text/* → text.read_text • else → unstructured.partition.auto.partition Return {"text": str, "truncated": bool}. Raise UnsupportedError for disallowed MIME. ### Deliver - Dispatcher file path. - `tests/test_parser_dispatcher.py` routing three samples and UnsupportedError for `.exe`.
VALIDATION	Test passes; UnsupportedError correctly raised.


⸻

Task 5  — Robust Text Reader

Section	Content
WHY	Prevent crashes from odd encodings and unreadable bytes.
PROMPT	### Analyze Check for existing text-parsing helpers. ### Act In `app/parsers/text.py` implement read_text(path): • Detect encoding via charset-normalizer. • Fallback utf-8 with errors="replace". • Return string, truncated=False. ### Deliver `tests/test_text_reader.py` reading UTF-8, ISO-8859-1, and a bad-bytes file.
VALIDATION	Test passes; no exceptions, output length > 0 in all cases.


⸻

Task 6  — PDF & Excel Parsers

Section	Content
WHY	Extract text efficiently while bounding resource usage.
PROMPT	### Analyze Extend or create parser modules. ### Act • `pdf.parse_pdf(path, max_pages=settings.MAX_PDF_PAGES)`   - Use unstructured; chunk 10 pages; run in asyncio.to_thread; 120 s timeout. • `excel.parse_excel(path, max_rows=settings.MAX_EXCEL_ROWS)`   - Read with pandas; slice rows; convert to markdown. ### Deliver - Parser modules. - `tests/test_excel_limit.py` (row cap) & benchmark harness (10 MB PDF < 5 s).
VALIDATION	Tests green; benchmarks under thresholds.


⸻

Task 7  — Background Parsing & Web-Socket Progress

Section	Content
WHY	Non-blocking UX; real-time progress feedback.
PROMPT	### Analyze Confirm WebSocket layer (ws/). ### Act • Modify `/uploadfile/` to enqueue `BackgroundTask(parse_file, uuid, path, mime)`. • Implement `ws/progress.py` endpoint `/ws/upload/{uuid}`. • Background task emits JSON events: {"status":"processing","progress":int,"message":str} and final "complete" or "error". ### Deliver - Updated endpoint, WS module. - `tests/test_ws_progress.py` using Starlette client: upload small txt, receive "processing" & "complete".
VALIDATION	Response latency < 200 ms; WebSocket messages received as expected.


⸻

Task 8  — Front-End Uploader & Live Progress

Section	Content
WHY	Grants users intuitive drag-and-drop with instant feedback.
PROMPT	### Analyze Look for existing upload component. ### Act • Add/extend `FileUploader.tsx` (drag zone + `<input type=file>`). • POST to `/uploadfile/`; extract `id`; open WS `/ws/upload/{id}`. • Show `ProgressBar.tsx`; display toasts for 413/415/403. ### Deliver Front-end components & `api.ts` helper.
VALIDATION	Manual QA: normal PDF shows progress to 100 %; 70 MB file triggers oversize toast.


⸻

Task 9  — CI / Security Pipeline

Section	Content
WHY	Blocks insecure or non-compliant code before release.
PROMPT	### Analyze If `.github/workflows/ci.yml` exists, extend; else create. ### Act Workflow steps: 1 Setup Python 3.11. 2 `pip install -r requirements.txt`. 3 `ruff` & `black --check`. 4 `bandit -r app` & `pip-audit`. 5 `pytest -q --cov=app` fail if <90 %. 6 `pytest-benchmark` fail if PDF parse >5 s. ### Deliver Updated CI file with badge snippet for README.
VALIDATION	GitHub Actions run passes. Push a formatting mistake; CI fails on black.


⸻

How to Execute
	1.	Feed each PROMPT block (one task at a time) to your AI coding assistant.
	2.	Run the VALIDATION checks; commit only when they pass.
	3.	Update CHANGELOG.md after each successful merge.

This list now (1) includes an explicit Analyze step so the assistant fits changes into the existing codebase, (2) maintains uniform structure, and (3) details an automated validation for every deliverable.
