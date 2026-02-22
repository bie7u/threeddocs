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

Projects are stored server-side as JSON documents. All project endpoints (except `/public`) require a valid session.

#### Project object

All project endpoints send and receive the same **flat** JSON object:

```json
{
  "id": 42,
  "name": "Assembly Guide v1",
  "projectType": "builder",
  "projectModelUrl": null,
  "steps": [],
  "connections": [],
  "guide": [{ "stepId": "step-abc" }],
  "nodePositions": { "step-abc": { "x": 100, "y": 200 } },
  "lastModified": 1700000000000
}
```

| Field | Type | Access | Description |
|-------|------|--------|-------------|
| `id` | `integer` | **read-only** | Server-assigned primary key |
| `name` | `string` | read/write | Human-readable project title |
| `projectType` | `"builder" \| "upload"` | read/write | Editor mode |
| `projectModelUrl` | `string \| null` | read/write | Remote URL or base64 data-URL of an uploaded GLB/GLTF |
| `steps` | `InstructionStep[]` | read/write | Ordered instruction steps |
| `connections` | `Edge[]` | read/write | ReactFlow edges between steps |
| `guide` | `Array<{stepId}>` | read/write | Ordered guide entries |
| `nodePositions` | `Record<string,{x,y}>` | read/write | Canvas positions per step id |
| `lastModified` | `integer` | **read-only** | Unix timestamp in ms of last save |

---

#### `GET /api/projects`

Returns all projects owned by the authenticated user.

**Auth:** required  

**Response `200 OK`**
```json
[
  {
    "id": 42,
    "name": "My 3D Model",
    "projectType": "builder",
    "projectModelUrl": null,
    "steps": [],
    "connections": [],
    "guide": [],
    "nodePositions": {},
    "lastModified": 1700000000000
  }
]
```

---

#### `POST /api/projects`

Creates a new project. The server assigns `id` and `lastModified` — do **not** include them in the request body.

**Auth:** required  

**Request body**
```json
{
  "name": "My 3D Model",
  "projectType": "builder",
  "projectModelUrl": null,
  "steps": [],
  "connections": [],
  "guide": [],
  "nodePositions": {}
}
```

**Response `201 Created`** – returns the saved object with server-assigned `id`.

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

### `ProjectData` (internal frontend type)

```typescript
interface ProjectData {
  id: string;           // string representation of the server integer id, e.g. "42"
  name: string;
  projectType?: 'builder' | 'upload';
  projectModelUrl?: string;   // data URL or remote URL for uploaded GLB/GLTF
  steps: InstructionStep[];
  connections: Edge<ConnectionData>[];
  guide?: GuideStep[];        // GuideStep.id is client-only (equals stepId)
}
```

### `GuideStep` (internal)

```typescript
interface GuideStep {
  id: string;     // client-only key, equals stepId; stripped before sending to server
  stepId: string;
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
