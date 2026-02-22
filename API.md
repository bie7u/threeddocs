# 3D Docs – API Documentation

This document describes all HTTP endpoints expected by the 3D Docs frontend.
The backend must implement these endpoints and use **httpOnly cookies** for
authentication (access token + refresh token).

---

## Base URL

All endpoints are prefixed with `/api`.  
During local development Vite proxies `/api` → `http://localhost:3000`.

Set a custom backend URL via the environment variable:

```
VITE_API_URL=https://api.example.com/api
```

---

## Authentication

The backend issues two httpOnly cookies on login:

| Cookie          | Description                              | Typical TTL |
|-----------------|------------------------------------------|-------------|
| `access_token`  | Short-lived JWT used for protected routes | 15 minutes  |
| `refresh_token` | Long-lived token used to get a new access token | 7 days |

All protected endpoints must validate the `access_token` cookie.  
The frontend automatically calls `POST /api/auth/refresh` when it receives a
`401` response, then retries the original request.  
If the refresh also fails the user is redirected to `/` (login page).

---

## Endpoints

### Authentication

#### `POST /api/auth/login`

Authenticate the user. On success the server **sets** `access_token` and
`refresh_token` as httpOnly `SameSite=Lax` cookies.

**Request body**
```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

**Response `200 OK`**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "Jan Kowalski"
}
```

**Response `401 Unauthorized`**
```json
{ "message": "Invalid email or password" }
```

---

#### `POST /api/auth/logout`

Invalidates the session. The server must **clear** both cookies.

**Auth:** required (access token cookie)  
**Request body:** empty  
**Response:** `204 No Content`

---

#### `POST /api/auth/refresh`

Issue a new access token using the refresh token cookie.  
The server **replaces** the `access_token` cookie (and optionally rotates the
`refresh_token`).

**Auth:** refresh token cookie (no access token required)  
**Request body:** empty  

**Response `200 OK`** – new access token set in cookie; body may be empty or:
```json
{ "ok": true }
```

**Response `401 Unauthorized`** – refresh token is expired or invalid; client
must redirect to login.

---

#### `GET /api/auth/me`

Returns the currently authenticated user. Used by the Dashboard on mount to
verify the session.

**Auth:** required (access token cookie)

**Response `200 OK`**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "Jan Kowalski"
}
```

**Response `401 Unauthorized`** – triggers the automatic token refresh flow.

---

### Projects (3D Models)

Projects are stored server-side as JSON documents.  
All project endpoints require a valid session.

#### `GET /api/projects`

Returns all projects owned by the authenticated user.

**Auth:** required  

**Response `200 OK`**
```json
[
  {
    "project": {
      "id": "project-uuid",
      "name": "My 3D Model",
      "projectType": "builder",
      "projectModelUrl": null,
      "steps": [],
      "connections": [],
      "guide": []
    },
    "nodePositions": {},
    "lastModified": 1700000000000
  }
]
```

---

#### `POST /api/projects`

Creates a new project.  
The client supplies the `id` (UUID generated client-side); the server must
accept it or return a server-generated replacement in the response.

**Auth:** required  

**Request body**
```json
{
  "project": {
    "id": "project-uuid",
    "name": "My 3D Model",
    "projectType": "builder",
    "projectModelUrl": null,
    "steps": [],
    "connections": [],
    "guide": []
  },
  "nodePositions": {},
  "lastModified": 1700000000000
}
```

**Response `201 Created`** – returns the saved document (same shape as above).

**Response `409 Conflict`** – project with this `id` already exists.

---

#### `GET /api/projects/:id`

Returns a single project by ID.

**Auth:** required  

**Response `200 OK`** – same shape as an element in `GET /api/projects`.  
**Response `404 Not Found`** – project does not exist or belongs to another user.

---

#### `PUT /api/projects/:id`

Replaces the full project document (complete replace, not partial patch).

**Auth:** required  

**Request body** – same shape as `POST /api/projects`.

**Response `200 OK`** – the updated document.  
**Response `404 Not Found`**

---

#### `DELETE /api/projects/:id`

Deletes the project.

**Auth:** required  

**Response `204 No Content`**  
**Response `404 Not Found`**

---

#### `GET /api/projects/:id/public`

Returns a project document **without authentication**. Used by the shareable
`/view/:projectId` link.

The backend must expose this project publicly only if the owner has enabled
sharing (or always, depending on business requirements).

**Auth:** none  

**Response `200 OK`** – same shape as `GET /api/projects/:id`.  
**Response `404 Not Found`**

---

## Data Schemas

### `SavedProject`

```typescript
interface SavedProject {
  project: ProjectData;
  nodePositions: Record<string, { x: number; y: number }>;
  lastModified: number; // Unix timestamp in milliseconds
}
```

### `ProjectData`

```typescript
interface ProjectData {
  id: string;
  name: string;
  projectType?: 'builder' | 'upload';
  projectModelUrl?: string;   // data URL or remote URL for uploaded GLB/GLTF
  steps: InstructionStep[];
  connections: Edge<ConnectionData>[];
  guide?: GuideStep[];
}
```

### `InstructionStep`

```typescript
interface InstructionStep {
  id: string;
  title: string;
  description: string;        // may contain sanitised HTML from the rich-text editor
  modelPath: string;
  cameraPosition: CameraPosition;
  annotations?: Annotation[];
  highlightColor?: string;
  shapeType?: 'cube' | 'sphere' | 'cylinder' | 'cone' | 'custom';
  customModelUrl?: string;    // data URL of an embedded GLB/GLTF
  modelScale?: number;
  focusMeshName?: string;     // upload-type: mesh to highlight
  focusPoint?: [number, number, number];
}
```

---

## Error Response Format

All error responses should follow this shape so the frontend can display them:

```json
{
  "message": "Human-readable description of the error"
}
```

---

## CORS

When the frontend is served from a different origin than the API, the backend
must configure CORS to:

- Allow the frontend origin (e.g. `https://app.example.com`)
- Allow credentials (`Access-Control-Allow-Credentials: true`)
- **Not** use the wildcard `*` for `Access-Control-Allow-Origin` when
  credentials are enabled (browsers block this)

---

## Cookie Requirements

| Attribute   | Value                | Reason                                          |
|-------------|----------------------|-------------------------------------------------|
| `HttpOnly`  | true                 | Prevents JavaScript access (XSS protection)    |
| `Secure`    | true (in production) | Transmitted only over HTTPS                     |
| `SameSite`  | `Lax`                | CSRF protection; `Strict` can break cookie delivery on first navigation |
| `Path`      | `/`                  | Sent with all requests to the server            |
