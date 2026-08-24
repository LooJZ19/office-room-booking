# Northpoint Workspaces — Office Room Booking

A room booking site built as a step-by-step AWS learning project.

## Phase 0 — run it on your own computer

You cannot just double-click `index.html`. Browsers block some things
on `file://` URLs. Start a tiny local web server instead.

**If you have Python installed** (Mac and Linux already do):

```bash
cd office-booking
python3 -m http.server 8000
```

Then open <http://localhost:8000>

**If you have Node.js instead:**

```bash
cd office-booking
npx serve
```

Press `Ctrl + C` in the terminal to stop the server.

### Things to try

1. Click **Book now** on any room card.
2. Tap `10:00`, then tap `13:00`. Watch the price update.
3. Fill the form and confirm — you get a booking reference.
4. Book the same room and date again. The hours you took are now
   greyed out. That is `API.getBookedHours()` doing its job.
5. Refresh the page. Your booking is gone.
   **That is the problem DynamoDB solves in Phase 4.**

## Folder structure

```
office-booking/
├── index.html          the whole page
├── css/
│   └── styles.css      design tokens at the top, then components
└── js/
    ├── data.js         room catalogue  → becomes a DynamoDB table
    ├── api.js          data access     → becomes fetch() to API Gateway
    ├── components.js   reusable UI functions
    ├── booking.js      booking flow + validation
    └── main.js         starts the app
```

## Why the code is split this way

Everything that touches data goes through **`api.js`**. No other file
knows whether the data came from a JavaScript array or from a server
in Singapore.

That single seam is what makes Phase 6 a small job instead of a rewrite.

## Road ahead

| Phase | What happens |
|---|---|
| 0 | ✅ Working site, running locally |
| 1 | AWS account, IAM user, billing alarm |
| 2 | Upload to S3 |
| 3 | CloudFront for HTTPS and speed |
| 4 | DynamoDB tables: `Rooms`, `Bookings` |
| 5 | Lambda functions + API Gateway |
| 6 | Rewrite `api.js` to call the real API |
| 7 | SES confirmation emails, Infrastructure as Code |

## Notes

- Room artwork is generated with CSS gradients so there are no image
  files to manage yet. Replace `.room-art` divs with `<img>` tags when
  you have real photos.
- The contact form and booking form both validate on the client. In
  Phase 5 you must validate again inside Lambda. Never trust the
  browser — anyone can bypass it.
