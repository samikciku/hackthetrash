# 📡 HackTheTrash API Reference

Base URL: `http://localhost:4000/api`

## Reports

### `GET /reports`
List all reports.

**Response:**
```json
{ "reports": [ { "id": "...", "latitude": 45.46, "longitude": 9.19, "status": "reported", ... } ] }
```

### `GET /reports/:id`
Get a single report.

### `POST /reports`
Create a new report. **multipart/form-data**.

| Field        | Type       | Required | Notes                           |
|--------------|------------|----------|---------------------------------|
| photos       | File[]     | ✅       | up to 5 image files             |
| latitude     | number     | ✅       |                                 |
| longitude    | number     | ✅       |                                 |
| severity     | string     | ❌       | small / medium / large          |
| description  | string     | ❌       |                                 |
| tags         | JSON array | ❌       | e.g. `["Plastic","Hazardous"]`  |
| anonymous    | boolean    | ❌       |                                 |

### `PATCH /reports/:id/status`
Update status (admin/moderator). JSON body: `{ "status": "verified" }`.

Statuses: `reported | verified | cleaning | cleaned | rejected`

## Auth (stub)

### `POST /auth/register`
### `POST /auth/login`
