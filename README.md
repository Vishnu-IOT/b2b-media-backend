# B2B Business Media Platform — Backend

Node.js + Express, MySQL + Sequelize, JWT + bcrypt, Multer (local uploads), CommonJS.
A media / knowledge-sharing backend: no checkout, payments, bookings or chat.

## Setup

```bash
npm install
cp .env.example .env          # fill in DB_* and JWT_SECRET
npm run db:create             # optional: creates the database from .env
npm run db:migrate
npm run db:seed               # super admin + 9 resource categories + demo data
npm run dev                   # http://localhost:5000/api
```

Seeded Super Admin: `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env` (default `admin@example.com` / `ChangeMe@123`) — change it.
Demo business admin: `demo@business.com` / `Demo@12345` (seeder `...03-demo-data.js`; skip it in production with
`npx sequelize-cli db:seed --seed 20260924000001-super-admin.js` and `...02-resource-categories.js`).

## Folder structure

```
server.js  app.js  .sequelizerc  .env.example
config/        config.js (DB, used by app + sequelize-cli)  constants.js  upload.js
models/        13 Sequelize models + index.js (all associations)
migrations/    13 migrations (one per table, FK order)
seeders/       super admin, resource categories, demo data
middlewares/   auth (authenticate/optionalAuth/authorize)  upload  validate  validators  errorHandler
controllers/   one per area  +  factories/businessContentFactory.js (shared by stories, strategies,
               achievements, products, enquiries, videos)
routes/        one per API group  +  contentRouter.js
services/      statusService (approval flow)  businessService  notificationService  moderationService  tokenService
utils/         AppError  asyncHandler  response  pagination  pick  slug  youtube  fileUtils  helpers
public/uploads/{images,videos,documents,thumbnails}
```

## Associations

```
User 1-1 Business            Business 1-N Stories | Strategies | Achievements | Products | Enquiries | Videos
ResourceCategory 1-N ResourcePost (RESTRICT delete)     ResourcePost N-1 User (createdBy)
User 1-N Question 1-N Answer       User 1-N Answer       User 1-N Notification (-> Question, Answer)
```

## Response format

```json
{ "success": true, "message": "Success", "data": {} }
{ "success": false, "message": "Validation failed", "errors": [{ "field": "title", "message": "title is required" }] }
```
Lists return `data: { items: [...], pagination: { page, limit, total, totalPages } }` (`?page=1&limit=10`, max 100).

## Roles and the approval flow

| | BUSINESS_ADMIN | SUPER_ADMIN |
|---|---|---|
| Business profile + own content | create / edit / delete **own only** | any business (pass `businessId`) |
| Status they can set | `DRAFT` or `PENDING` (anything else becomes `PENDING`) | any of `DRAFT PENDING PUBLISHED REJECTED` |
| Approve / reject | no | `PATCH /api/admin/content/:type/:id/status` |
| Resource categories + posts | read only | full control |

- New business content → `PENDING`. Editing published/rejected content sends it back to `PENDING`.
- Public endpoints only return `PUBLISHED` items **whose business is also `PUBLISHED`**.
- Owners and Super Admin can still open their own draft/pending/rejected items by id.

## Endpoints

**Auth** `/api/auth` — registration requires email verification (OTP), the newsletter does not:
- `POST /register` `{ name, email, password }` — creates an unverified BUSINESS_ADMIN and emails a 6-digit OTP (valid `OTP_EXPIRES_MIN` minutes). No token yet. Disable with `ALLOW_PUBLIC_REGISTRATION=false`. Re-registering the same unverified email resends a fresh OTP instead of erroring.
- `POST /verify-otp` `{ email, otp }` — confirms the OTP, marks the account verified, returns the JWT (this is when the account can actually be used), and sends a "Your account is ready" email with an **Open admin panel** button linking to `ADMIN_PANEL_URL`.
- `POST /resend-otp` `{ email }` — issues a fresh OTP for a still-unverified account (invalidates the previous one).
- `POST /login` `{ email, password }` — `403` if the email hasn't been verified yet.
- `GET /me`, `PUT /change-password`
Accounts the Super Admin creates directly (`POST /api/admin/users`) skip the OTP step and can log in immediately.

**Business** `/api/business` — `GET /` (directory, `?q=&industry=&location=`), `GET /me`, `PUT /me`, `GET /:idOrSlug` (profile + published content), `POST /`, `PUT /:id`, `DELETE /:id` (Super Admin). Files: `logo`, `coverImage`.

**Business content** — same shape for each: `GET /` (public), `GET /mine`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`

| Route | Fields | Files |
|---|---|---|
| `/api/stories`, `/api/strategies` | title, content | `coverImage` |
| `/api/achievements` | title, description, awardName, awardedBy, awardDate | `image` |
| `/api/products` (also `GET /:slug`, `?upcoming=true\|false`) | name, description, launchDate | `image` |
| `/api/enquiries` (`?category=&location=&q=`) | title, description, category, location, contactInfo | — |
| `/api/videos` (`?type=YOUTUBE\|UPLOAD`) | title, description, **youtubeUrl _or_** file `video` | `video`, `thumbnail` |

**Resources** — `/api/resource-categories` (`GET /`, `GET /:idOrSlug`, Super Admin `POST/PUT/DELETE`);
`/api/resources` (`GET /?category=<slug>&q=`, `GET /:idOrSlug`, Super Admin `POST/PUT/DELETE`). Post files: `coverImage`, `file` (PDF/doc), `video`, or `videoUrl` (YouTube).

**Q&A** — `/api/questions` (`GET /`, `GET /mine`, `GET /:id`, `POST`, `PUT/DELETE /:id`), `/api/answers` (`GET /?questionId=`, `POST`, `PUT/DELETE /:id`), `/api/notifications` (`GET /?isRead=false`, `GET /unread-count`, `PATCH /read-all`, `PATCH /:id/read`, `DELETE /:id`). Answering creates a `NEW_ANSWER` notification for the question owner (not when you answer your own).

**Newsletter** `/api/newsletter` — no OTP here, subscribing is a single step:
`POST /subscribe` `{ email }` (adds the email immediately — or reactivates it if previously unsubscribed — and sends a short welcome email), `GET /unsubscribe?token=` (the link in every email's footer).
Every time a resource post is newly set to `PUBLISHED` (create or update), an email goes out to every active subscriber
with the title, summary and a link. Without `SMTP_*` configured, emails are logged to the console instead of sent — useful
for local development.

**Admin** `/api/admin` (Super Admin) — `GET /stats`, `GET /pending`, users CRUD (`/users`), moderation:
`GET /content/:type?status=PENDING|all`, `PATCH /content/:type/:id/status`, `DELETE /content/:type/:id`
where `:type` = `businesses | stories | strategies | achievements | products | enquiries | videos | questions | answers`.

## Email templates

`services/emailTemplates.js` holds one shared dark, card-style HTML wrapper (`wrapEmail`) used by every transactional
email, plus the 4 specific messages: `otpEmail`, `welcomeEmail` (admin panel link, sent after `verify-otp`),
`subscribeWelcomeEmail`, and `newPostEmail`. They're plain template functions with inline styles (no build step, no
external fonts/images — safe across email clients) — edit the `ACCENT`/`BG`/`CARD` constants at the top of the file to
reskin, or edit a single template's `bodyHtml` to change its copy. `EMAIL_BRAND_NAME` (`.env`) sets the small header
label shown in every email.

## Uploads

Multipart fields → folder: `logo/coverImage/image` → `images/`, `thumbnail` → `thumbnails/`, `video` → `videos/`, `file` → `documents/`.
Limits: images/thumbnails 5 MB (jpg, png, webp, gif), video 200 MB (mp4, webm, mov), documents 20 MB (pdf, doc, docx).
Filenames are generated (extension comes from the MIME type). MySQL stores only the path, e.g. `/uploads/images/1790-ab12.png`;
files are served at `http://<host>/uploads/...`. Old files are deleted when replaced or when the record is deleted.
Every create/update endpoint accepts either JSON or `multipart/form-data`.

## Examples

```bash
API=http://localhost:5000/api

# Register (sends OTP) -> verify (returns token) -> login later works directly
curl -X POST $API/auth/register -H 'Content-Type: application/json' \
  -d '{"name":"Asha","email":"asha@example.com","password":"Passw0rd!x"}'
TOKEN=$(curl -s -X POST $API/auth/verify-otp -H 'Content-Type: application/json' \
  -d '{"email":"asha@example.com","otp":"123456"}' | jq -r .data.token)
# forgot/expired OTP: curl -X POST $API/auth/resend-otp -d '{"email":"asha@example.com"}'

# Create the business profile with a logo (multipart) -> status PENDING
curl -X POST $API/business -H "Authorization: Bearer $TOKEN" \
  -F companyName="Asha Textiles" -F industry=Textiles -F location=Salem -F logo=@logo.png

# Post a story (JSON) -> PENDING; save as draft with "status":"DRAFT"
curl -X POST $API/stories -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"How we started","content":"..."}'

# Upcoming product with image
curl -X POST $API/products -H "Authorization: Bearer $TOKEN" \
  -F name="Silk Saree 2027" -F launchDate=2027-01-10 -F image=@saree.jpg

# Video: YouTube URL ...
curl -X POST $API/videos -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Factory tour","youtubeUrl":"https://youtu.be/dQw4w9WgXcQ"}'
# ... or an uploaded file
curl -X POST $API/videos -H "Authorization: Bearer $TOKEN" \
  -F title="Factory tour" -F video=@tour.mp4 -F thumbnail=@thumb.jpg

# Super Admin: review the queue, approve, reject
ADMIN=$(curl -s -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"ChangeMe@123"}' | jq -r .data.token)
curl "$API/admin/pending" -H "Authorization: Bearer $ADMIN"
curl "$API/admin/content/stories?status=PENDING" -H "Authorization: Bearer $ADMIN"
curl -X PATCH $API/admin/content/stories/1/status -H "Authorization: Bearer $ADMIN" \
  -H 'Content-Type: application/json' -d '{"status":"PUBLISHED"}'

# Super Admin: resource category + post (cover image + PDF + YouTube)
curl -X POST $API/resource-categories -H "Authorization: Bearer $ADMIN" \
  -H 'Content-Type: application/json' -d '{"name":"Exports","description":"Export help"}'
curl -X POST $API/resources -H "Authorization: Bearer $ADMIN" \
  -F categoryId=1 -F title="5 Marketing Strategies for MSMEs" -F summary="..." -F content="<p>...</p>" \
  -F coverImage=@cover.jpg -F file=@guide.pdf -F videoUrl="https://youtu.be/dQw4w9WgXcQ"
curl "$API/resources?category=marketing&page=1&limit=10"

# Newsletter: one-step subscribe (no OTP), unsubscribe later from the email link
curl -X POST $API/newsletter/subscribe -H 'Content-Type: application/json' -d '{"email":"reader@example.com"}'

# Q&A + notifications
curl -X POST $API/questions -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"How do I register for GST?","description":"...","category":"GST"}'
curl -X POST $API/answers -H "Authorization: Bearer $OTHER_TOKEN" -H 'Content-Type: application/json' \
  -d '{"questionId":1,"answer":"Apply on the GST portal."}'
curl $API/notifications/unread-count -H "Authorization: Bearer $TOKEN"
```

## Notes / production checklist

- Set a long random `JWT_SECRET`, `NODE_ENV=production`, and `CORS_ORIGIN` to your frontend origin(s).
- Put a reverse proxy (nginx) in front and raise its `client_max_body_size` to fit 200 MB videos.
- Uploads are validated by declared MIME type + size. For stricter checks add magic-number sniffing (e.g. `file-type`).
- Consider `express-rate-limit` on `/api/auth/*` before going public.
