# 3D Docs – API Documentation

This document describes all HTTP endpoints expected by the 3D Docs frontend.
The backend must implement these endpoints and use **httpOnly cookies** for
authentication (access token + refresh token).

---

## Base URL

All endpoints are prefixed with `/api`.  
During local development Vite proxies `/api` → `http://localhost:8000`.

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

#### `POST /api/projects/:id/share`

Generates (or regenerates) a unique, unguessable share token (UUID) for the project
and returns it. Subsequent calls may return the same token or a new one depending on
the server implementation.

**Auth:** required (access token cookie)  
**Request body:** empty  

**Response `200 OK`**
```json
{ "shareToken": "550e8400-e29b-41d4-a716-446655440000" }
```

**Response `404 Not Found`** – project does not exist or belongs to another user.

---

#### `GET /api/projects/shared/:shareToken`

Returns a project document **without authentication**. Used by the shareable
`/view/:shareToken` link.

The backend must look up the project associated with `shareToken` and expose it
publicly only if a share token exists for it.

**Auth:** none  

**Response `200 OK`** – same shape as `GET /api/projects/:id`.  
**Response `404 Not Found`** – token is invalid or project has been deleted.

---

#### `POST /api/projects/guest`

Creates a **guest project** without authentication. The server immediately
assigns a unique share token and returns it alongside the project. Guest
projects are publicly readable via the standard
`GET /api/projects/shared/:shareToken` endpoint.

**Auth:** none  
**Request body** – same shape as `POST /api/projects`.

**Response `201 Created`**
```json
{
  "id": 99,
  "name": "My 3D Model",
  "projectType": "upload",
  "projectModelUrl": "data:...",
  "steps": [],
  "connections": [],
  "guide": [],
  "nodePositions": {},
  "lastModified": 1700000000000,
  "shareToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

#### `PUT /api/projects/guest/:shareToken`

Updates a guest project. The share token acts as the sole authentication
credential — anyone who knows the token can update the project.

**Auth:** none (token in URL)  
**Request body** – same shape as `POST /api/projects`.

**Response `200 OK`** – the updated document (without `shareToken`).  
**Response `404 Not Found`** – token is invalid or project has been deleted.

---

### Custom 3D Elements ("Stwórz element 3D")

Custom 3D elements are text-based 3D shapes generated from up to 5 characters.
They are stored per-user and referenced from instruction steps by `custom3dElementId`.
All endpoints require a valid session.

#### Custom 3D Element object

```json
{
  "id": "custom3d-uuid",
  "name": "ABC",
  "text": "ABC",
  "color": "#4299e1",
  "wireframe": false,
  "wireframeColor": "#000000",
  "textureDataUrl": "data:image/png;base64,…",
  "createdAt": 1700000000000
}
```

| Field | Type | Access | Description |
|-------|------|--------|-------------|
| `id` | `string` | **read-only** | Server-assigned UUID |
| `name` | `string` | read/write | Display name (equals `text` by default) |
| `text` | `string` | read/write | Source text for the 3D shape – **max 5 characters** |
| `color` | `string` | read/write | Hex fill color, e.g. `"#4299e1"` |
| `wireframe` | `boolean` | read/write | Whether to render the wireframe overlay |
| `wireframeColor` | `string` | read/write | Hex wireframe line color |
| `textureDataUrl` | `string \| null` | read/write | Base64 data URL of the texture image (PNG/JPG/WebP, max 5 MB); `null` if no texture |
| `createdAt` | `integer` | **read-only** | Unix timestamp in ms of creation |

---

#### `GET /api/elements`

Returns all custom 3D elements owned by the authenticated user.

**Auth:** required

**Response `200 OK`**
```json
[
  {
    "id": "custom3d-uuid",
    "name": "ABC",
    "text": "ABC",
    "color": "#4299e1",
    "wireframe": false,
    "wireframeColor": "#000000",
    "textureDataUrl": null,
    "createdAt": 1700000000000
  }
]
```

---

#### `POST /api/elements`

Creates a new custom 3D element. The server assigns `id` and `createdAt`.

**Auth:** required

**Request body** – JSON; `textureDataUrl` may be omitted or `null`
```json
{
  "name": "ABC",
  "text": "ABC",
  "color": "#4299e1",
  "wireframe": false,
  "wireframeColor": "#000000",
  "textureDataUrl": null
}
```

**Validation**
- `text` must be 1–5 characters (non-empty after trimming).
- `textureDataUrl` is optional. When provided (not `null`), it must be a valid
  `data:image/…;base64,…` string whose decoded size does not exceed **5 MB**.

**Response `201 Created`** – returns the saved object with server-assigned `id` and `createdAt`.

**Response `422 Unprocessable Entity`**
```json
{ "message": "text must be 1–5 characters" }
```

---

#### `GET /api/elements/:id`

Returns a single custom 3D element by ID.

**Auth:** required

**Response `200 OK`** – same shape as an element in `GET /api/elements`.
**Response `404 Not Found`** – element does not exist or belongs to another user.

---

#### `PUT /api/elements/:id`

Replaces the full element document (complete replace, not partial patch).

**Auth:** required

**Request body** – same shape as `POST /api/elements`.

**Response `200 OK`** – the updated document.
**Response `404 Not Found`**
**Response `422 Unprocessable Entity`**

---

#### `DELETE /api/elements/:id`

Deletes the custom 3D element.

**Auth:** required

**Response `204 No Content`**
**Response `404 Not Found`**

---

### Uploaded 3D Models ("Wgraj element 3D")

Uploaded 3D models are GLB/GLTF files provided by the user.
They are stored per-user and referenced from instruction steps by `uploadedModelId`.
All endpoints require a valid session.

#### Uploaded 3D Model object

```json
{
  "id": "uploaded3d-uuid",
  "name": "Silnik turbinowy",
  "modelUrl": "https://cdn.example.com/models/uploaded3d-uuid.glb",
  "modelFileName": "engine.glb",
  "modelScale": 1.0,
  "createdAt": 1700000000000
}
```

| Field | Type | Access | Description |
|-------|------|--------|-------------|
| `id` | `string` | **read-only** | Server-assigned UUID |
| `name` | `string` | read/write | Human-readable model name |
| `modelUrl` | `string` | **read-only** | Public HTTPS URL to download the stored GLB/GLTF file |
| `modelFileName` | `string` | **read-only** | Original filename supplied at upload |
| `modelScale` | `number` | read/write | Default scale factor (0.1 – 5.0) applied when the model is added to a step |
| `createdAt` | `integer` | **read-only** | Unix timestamp in ms of creation |

---

#### `GET /api/models`

Returns all uploaded 3D models owned by the authenticated user.

**Auth:** required

**Response `200 OK`**
```json
[
  {
    "id": "uploaded3d-uuid",
    "name": "Silnik turbinowy",
    "modelUrl": "https://cdn.example.com/models/uploaded3d-uuid.glb",
    "modelFileName": "engine.glb",
    "modelScale": 1.0,
    "createdAt": 1700000000000
  }
]
```

---

#### `POST /api/models`

Uploads a new 3D model file and creates the model record.

**Auth:** required
**Content-Type:** `multipart/form-data`

| Form field | Type | Required | Description |
|------------|------|----------|-------------|
| `file` | binary | yes | The GLB or GLTF file, **max 50 MB** |
| `name` | string | yes | Human-readable model name |
| `modelScale` | number | no | Default scale factor (0.1–5.0, default `1.0`) |

**Example request (curl)**
```bash
curl -X POST /api/models \
  -b "access_token=…" \
  -F "file=@engine.glb" \
  -F "name=Silnik turbinowy" \
  -F "modelScale=1.0"
```

**Validation**
- `file` must have the extension `.glb` or `.gltf` and must not exceed **50 MB**.
- `name` must be non-empty after trimming.
- `modelScale` must be between `0.1` and `5.0` (inclusive).

**Response `201 Created`** – returns the model object with the server-assigned
`id`, `modelUrl` (pointing to the stored file), `modelFileName`, and `createdAt`.

```json
{
  "id": "uploaded3d-uuid",
  "name": "Silnik turbinowy",
  "modelUrl": "https://cdn.example.com/models/uploaded3d-uuid.glb",
  "modelFileName": "engine.glb",
  "modelScale": 1.0,
  "createdAt": 1700000000000
}
```

**Response `413 Content Too Large`** – file exceeds 50 MB.
**Response `422 Unprocessable Entity`**
```json
{ "message": "Only .glb and .gltf files are supported" }
```

---

#### `GET /api/models/:id`

Returns a single uploaded 3D model by ID.

**Auth:** required

**Response `200 OK`** – same shape as an element in `GET /api/models`.
**Response `404 Not Found`** – model does not exist or belongs to another user.

---

#### `PUT /api/models/:id`

Updates editable metadata of the model (`name`, `modelScale`). The binary
file cannot be replaced; upload a new model instead.

**Auth:** required
**Content-Type:** `application/json`

**Request body**
```json
{
  "name": "Silnik turbinowy v2",
  "modelScale": 1.5
}
```

**Response `200 OK`** – the updated model object.
**Response `404 Not Found`**
**Response `422 Unprocessable Entity`**

---

#### `DELETE /api/models/:id`

Deletes the model record and its stored file.

**Auth:** required

**Response `204 No Content`**
**Response `404 Not Found`**

---

## Data Schemas

### `Custom3DElement`

```typescript
interface Custom3DElement {
  id: string;
  name: string;
  text: string;               // max 5 characters – source for the 3D text shape
  color: string;              // hex fill color, e.g. "#4299e1"
  wireframe: boolean;
  wireframeColor: string;     // hex wireframe line color
  textureDataUrl: string | null; // base64-encoded image (PNG/JPG/WebP, max 5 MB); null if absent
  createdAt: number;          // Unix timestamp in ms
}
```

---

### `UploadedModel3D`

```typescript
interface UploadedModel3D {
  id: string;
  name: string;
  modelUrl: string;          // HTTPS URL to the stored GLB/GLTF file
  modelFileName: string;     // original filename
  modelScale: number;        // default scale factor (0.1 – 5.0)
  createdAt: number;         // Unix timestamp in ms
}
```

---

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
  description: string;           // may contain sanitised HTML from the rich-text editor
  modelPath: string;
  cameraPosition: CameraPosition;
  annotations?: Annotation[];
  highlightColor?: string;
  shapeType?: 'cube' | 'sphere' | 'cylinder' | 'cone' | 'custom'
            | 'custom3dElement' | 'uploadedModel';
  customModelUrl?: string;       // data URL of an embedded GLB/GLTF
  modelScale?: number;
  custom3dElementId?: string;    // ID from GET /api/elements – used when shapeType === 'custom3dElement'
  uploadedModelId?: string;      // ID from GET /api/models   – used when shapeType === 'uploadedModel'
  focusMeshName?: string;        // upload-type: mesh to highlight
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
