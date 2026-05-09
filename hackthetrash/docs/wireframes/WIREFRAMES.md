# 🎨 HackTheTrash — Wireframes & User Flows

## 1. 🧭 User Flows

### Flow A — Citizen Reports a Dump (mobile, anonymous)
```
[Home/Map] ──► [Tap "Report Trash" 📸]
        │
        ▼
[Camera/Upload Photos] ──► [Allow GPS? ✅]
        │
        ▼
[Auto-fill Location pin on mini-map]
   (user can drag to adjust)
        │
        ▼
[Add Tags: plastic, hazardous, e-waste...]
[Severity: small / medium / large]
[Optional description]
        │
        ▼
[Submit] ──► [Thank you screen + share link]
        │
        ▼
[Report appears on public map after moderation]
```

### Flow B — Authority Resolves a Report
```
[Dashboard Login] ──► [List of reports in region]
        │
        ▼
[Open report] ──► [View photos / location]
        │
        ▼
[Update Status: Scheduled → In Progress → Cleaned]
        │
        ▼
[Auto-notify reporter + map color updates]
```

### Flow C — Public Browses Map
```
[Landing Page] ──► [Map View 🗺️]
        │
        ▼
[Filter by: status / severity / date / tags]
        │
        ▼
[Click marker] ──► [Photo gallery + details + comments]
```

---

## 2. 📱 Wireframe — Submission Form (Mobile)

```
┌─────────────────────────────┐
│  ← Back        Report Trash │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │   📸 Tap to add       │  │
│  │      photo(s)         │  │
│  │                       │  │
│  └───────────────────────┘  │
│  [+ Add another]            │
│                             │
│  📍 Location                │
│  ┌───────────────────────┐  │
│  │   [mini map preview]  │  │
│  │      • pin            │  │
│  └───────────────────────┘  │
│  Lat: 45.4642  Lng: 9.1900  │
│  [Use my location] [Adjust] │
│                             │
│  🏷️ What kind of trash?    │
│  [Plastic] [E-waste]        │
│  [Hazardous] [Construction] │
│  [Other]                    │
│                             │
│  📏 Size                    │
│  ( ) Small  (•) Medium      │
│  ( ) Large                  │
│                             │
│  📝 Description (optional)  │
│  ┌───────────────────────┐  │
│  │                       │  │
│  └───────────────────────┘  │
│                             │
│  [☐] Submit anonymously     │
│                             │
│  ┌───────────────────────┐  │
│  │     SUBMIT REPORT     │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

---

## 3. 🗺️ Wireframe — Public Map (Desktop)

```
┌────────────────────────────────────────────────────────────────┐
│ HackTheTrash  🗺️ Map  📊 Stats  ℹ️ About    [Report] [Sign in] │
├────────────────────────────────────────────────────────────────┤
│ ┌──────────┐                                                   │
│ │ Filters  │                                                   │
│ │          │            🗺️                                     │
│ │ Status   │      🔴 reported                                  │
│ │ ☑ New    │      🟡 verified        🔴                        │
│ │ ☑ Verif. │   🟡        🟢                                    │
│ │ ☐ Done   │             cleaned                               │
│ │          │                  🔴                               │
│ │ Severity │      🟢                  🟡                       │
│ │ ▮▮▮▮▮    │                                                   │
│ │          │                          🔴                       │
│ │ Type     │                                                   │
│ │ ☑ Plastic│                                                   │
│ │ ☑ E-waste│                                                   │
│ │ ☑ Hazard │                                                   │
│ │          │                                                   │
│ │ Date     │                                                   │
│ │ [Last 30d]│                                                  │
│ └──────────┘                                                   │
│                                                                │
│  Showing 247 reports • Last updated: 2 min ago                 │
└────────────────────────────────────────────────────────────────┘
```

### Marker Popup
```
┌──────────────────────────────┐
│ [photo thumbnail]            │
│ 🔴 Reported • 2 days ago     │
│ 📍 Via Roma 12, Milano       │
│ 🏷️ Plastic, Construction     │
│ 📏 Large                     │
│ 👍 12 confirms  💬 3 comments│
│ [View details →]             │
└──────────────────────────────┘
```

---

## 4. 🏛️ Wireframe — Authority Dashboard

```
┌────────────────────────────────────────────────────────────────┐
│ Dashboard — Comune di Milano          [User ▼] [Logout]        │
├────────────────────────────────────────────────────────────────┤
│ Today: 12 new  |  Week: 47  |  Pending: 23  |  Cleaned: 156    │
├──────────────┬─────────────────────────────────────────────────┤
│ Sidebar      │  Reports queue                       [Map view] │
│              │  ┌───────────────────────────────────────────┐  │
│ 📊 Overview  │  │ #1247 🔴 Large pile near park - 1h ago    │  │
│ 📋 Reports   │  │ #1246 🟡 Verified - dumpster fire - 3h    │  │
│ 🗺️ Map       │  │ #1245 🟢 Cleaned - construction debris    │  │
│ 👥 Users     │  │ #1244 🔴 Hazardous chemicals - 5h ago ⚠️ │  │
│ 📈 Analytics │  │ ...                                       │  │
│ ⚙️ Settings  │  └───────────────────────────────────────────┘  │
│              │                                                 │
│              │  [Bulk: Verify | Reject | Schedule cleanup]    │
└──────────────┴─────────────────────────────────────────────────┘
```

---

## 5. 🏠 Wireframe — Landing Page

```
┌────────────────────────────────────────────────────────────────┐
│ HackTheTrash 🗑️                              [Sign in] [Report]│
├────────────────────────────────────────────────────────────────┤
│                                                                │
│        Together, let's clean up our cities. 🌍                 │
│                                                                │
│   Spot illegal trash? Snap a photo, drop a pin, change         │
│   your community.                                              │
│                                                                │
│        [📸 Report Trash]    [🗺️ View Map]                     │
│                                                                │
│   ─────────────────────────────────────────                   │
│   📊 1,245 reports  •  734 cleaned  •  12 cities              │
│   ─────────────────────────────────────────                   │
│                                                                │
│   How it works:                                                │
│   1️⃣ Snap → 2️⃣ Locate → 3️⃣ Submit → 4️⃣ Cleaned!              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 6. 🎨 Design Tokens (preview)

| Token        | Value           |
|--------------|-----------------|
| Primary      | #16A34A (green) |
| Danger/Trash | #DC2626 (red)   |
| Warning      | #F59E0B         |
| Success      | #10B981         |
| Bg           | #F9FAFB         |
| Text         | #111827         |
| Font         | Inter, system   |

