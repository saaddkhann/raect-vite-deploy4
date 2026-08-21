# Madanpur Gramin Circle Cricket League Tournament

Complete React + Vite tournament registration project using Firebase Firestore/Auth/FCM and Cloudinary for uploaded files.

## Included features

- Player registration
- Player photo upload to Cloudinary
- Aadhaar upload to Cloudinary
- Payment screenshot upload to Cloudinary
- Cloudinary secure URL stored in Firestore
- Payment QR and UPI ID
- Playing role, batting style, bowling style
- Previous cricket experience / feedback
- Indian mobile number validation
- Free browser notifications using Firebase Cloud Messaging
- Admin Firebase email/password + admin allow-list
- Admin dashboard with search and status filters
- Approve/reject players
- Rejection reason
- Edit player details
- Player photo shown in admin dashboard
- Aadhaar and payment links for admin
- Team creation, assignment and deletion
- Excel and CSV export
- Notification resend after approval/rejection
- Firestore security rules
- Firebase Functions notification sender
- Vercel/Firebase Hosting compatible

## 1. Install

```bash
npm install
npm run dev
```

## 2. Create `.env`

Copy `.env.example` to `.env` and enter your real values:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
```

Do not commit `.env`.

## 3. Cloudinary

Create an unsigned upload preset in Cloudinary: Settings -> Upload presets -> Add upload preset.

Set the preset to accept JPG/PNG/WEBP and PDF as needed. The app uploads directly to Cloudinary and stores only the returned `secure_url` in Firestore.

Use a separate, restricted design for Aadhaar in production because unsigned browser uploads are not private. Do not put a Cloudinary API secret in Vite environment variables.

## 4. Firebase

Enable:

- Authentication -> Email/Password
- Firestore Database
- Cloud Messaging
- Firebase Functions

Create an admin Authentication user. Copy its UID and create:

`admins/{UID}`

with:

```json
{"active": true, "name": "Tournament Admin"}
```

## 5. FCM

Firebase Console -> Project settings -> Cloud Messaging -> Web Push certificates -> Generate key pair.

Put the public key in `VITE_FIREBASE_VAPID_KEY`.

The website registers `/firebase-messaging-sw.js` and passes the Firebase web config to the service worker.

Deployed web push requires HTTPS. The player must grant browser notification permission.

## 6. Functions

From the project root:

```bash
cd functions
npm install
cd ..
firebase login
firebase use --add
firebase deploy --only firestore:rules,functions
```

The function is in `functions/index.js`. It sends a browser push when an admin changes a registration to approved/rejected and also supports admin resend.

## 7. Payment QR

Replace `public/payment-qr.png` with your real UPI QR image and edit:

`src/data/tournament.js`

for the real fee and UPI ID.

## 8. Vercel

Add all `VITE_*` values from `.env` to Vercel Project -> Settings -> Environment Variables, then redeploy.

## Data model

Firestore `registrations/{registrationId}` contains player fields and Cloudinary URLs:

- `photoUrl`
- `aadhaarUrl`
- `paymentUrl`

It also stores approval status, team, FCM token/status and timestamps.

The admin export intentionally omits the Aadhaar number and Aadhaar URL to reduce accidental exposure in spreadsheets; it includes player photo and payment screenshot URLs.

## Security note

Aadhaar is sensitive identity information. The current direct unsigned Cloudinary upload is convenient for a small tournament but should be replaced with authenticated/signed private delivery before handling real Aadhaar documents at scale. Never make Aadhaar URLs publicly shareable.
