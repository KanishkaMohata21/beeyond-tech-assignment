# 🚀 Beeyond Tech Media (Expo + Node.js)

## Project Overview
Design and build a Cloud Media Gallery Application where users can register, authenticate securely, upload images and videos, and view their media in a performant gallery layout.

---

## Architecture Explanation
The project follows a **Client-Server architecture** with a clear separation of concerns:

- **Mobile (Frontend)**: Built with **Expo** (Managed Workflow) and **TypeScript**. Uses modern React practices, including Hooks and Redux Toolkit for centralized state management.
- **Backend (API)**: A **Node.js + Express** server handling authentication, media metadata storage, and file processing.
- **Database**: **MongoDB** for persistent storage of user profiles and media information.
- **Media Storage**: **AWS S3** for secure and scalable hosting of images and videos.
- **Deployment**: The backend is **Dockerized** and ready for deployment on any Cloud VM (AWS EC2, DigitalOcean, etc.).

---

## Folder Structure

### Backend
```
backend/
├── src/
│   ├── controllers/    # API logic
│   ├── middleware/     # Auth & Upload validation
│   ├── models/         # Mongoose schemas (User, Media)
│   ├── routes/         # Express routes (Auth, Media)
│   ├── utils/          # S3 utility functions
│   └── index.ts        # Entry point
├── Dockerfile          # Multi-stage production build
└── docker-compose.yml  # Local/Production orchestration
```

### Frontend
```
frontend/
├── app/                # expo-router (Tabs: Gallery, Favorites, Profile)
├── components/         # Reusable UI (Optimized FlatList items, Skeleton)
├── constants/          # Themes, API Config, Context
├── services/           # Axios API services with interceptors
├── store/              # Redux Toolkit (auth, media, network slices)
├── assets/             # Images and Icons
└── app.json            # Expo configuration
```

---

## State Management Strategy
The application uses **Redux Toolkit** for predictable and efficient state management:
- **Auth Slice**: Manages session state, user info, and loading/error states.
- **Media Slice**: Handles gallery data, favorites, infinite scroll pagination, and upload progress.
- **Network Slice**: Tracks real-time online/offline status using `@react-native-community/netinfo`.

---

## Token Handling Strategy
- **Secure Storage**: Access and Refresh tokens are stored using `expo-secure-store` (Hardware-encrypted storage).
- **Axios Interceptors**:
    - **Request**: Automatically attaches the `Authorization: Bearer <Access Token>` header.
    - **Response**: Handles `401 Unauthorized` by attempting to refresh the token using the `refreshToken`. If successful, it retries the original request; otherwise, it logs the user out.

---

## Offline Handling Strategy
- **Network Detection**: Uses a global listener in `_layout.tsx` to update the store with connectivity status.
- **Data Caching**: Previously fetched media and favorites are cached in `AsyncStorage`.
- **Offline Visibility**: If the device is offline, the app serves cached content and displays a visible "Offline" indicator.
- **Controlled Actions**: Uploading and favoriting are disabled with user feedback (Toasts/Banners) when offline.

---

## Setup Instructions

### Backend Local Setup
1. `cd backend`
2. `npm install`
3. Create a `.env` file (see below).
4. `npm run dev`

### Docker Commands
Build and run the entire stack (Express + MongoDB):
```bash
docker-compose up --build
```

### Environment Variables Required
**Backend (`backend/.env`):**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/beeyond-media
JWT_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_bucket_name
```

---

## Deployment Steps (Cloud VM)
1. Provision an **AWS EC2** (Ubuntu) or similar VM.
2. Install **Docker** and **Docker Compose**.
3. Clone the repository.
4. Set up the `.env` file on the VM.
5. Run `docker-compose up -d --build`.
6. Ensure port `5000` is open in the VM security group.

---

## Performance Optimizations Implemented
- **Optimized FlatList**:
    - `removeClippedSubviews={true}` for memory management.
    - `initialNumToRender={15}` and `maxToRenderPerBatch={20}` for smoothness.
    - `keyExtractor` for efficient DOM reconciliation.
- **Image Performance**: Uses `expo-image` for high-performance caching and smooth transitions.
- **Memoization**: `useCallback` and `React.memo` for critical components to prevent re-renders.
- **Infinite Scroll**: Cursor/Page-based pagination to avoid loading large datasets at once.
- **Skeleton Loaders**: Improved perceived performance during data fetching.

