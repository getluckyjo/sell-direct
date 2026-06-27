# API modules

Modular monolith. Each module owns one domain and exposes a small surface to
the rest of the app. External services are reached only through adapter
interfaces defined inside the relevant module — no vendor SDK calls leak into
business logic.

| Module          | Responsibility                                              | Introduced |
| --------------- | ----------------------------------------------------------- | ---------- |
| `messaging`     | WhatsApp BSP adapter (swappable) + inbound/outbound webhook | PR 3       |
| `listings`      | Property listings + guided intake flow                      | PR 2 / 4   |
| `deals`         | Deal state machine (the core) + append-only event log       | PR 2       |
| `profiles`      | Buyer & seller profiles                                     | PR 2       |
| `finance`       | Bond originator referral hand-off (ooba), behind an adapter | PR 5       |
| `notifications` | Outbound notifications                                      | later      |
| `auth`          | `AuthProvider` seam (Supabase Auth); concrete adapter       | PR 6       |
| `storage`       | `StorageProvider` seam (Supabase Storage); concrete adapter | uploads    |
