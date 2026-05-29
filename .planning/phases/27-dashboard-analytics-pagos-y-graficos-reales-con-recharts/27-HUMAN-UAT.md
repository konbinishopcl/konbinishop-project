---
status: partial
phase: 27-dashboard-analytics-pagos-y-graficos-reales-con-recharts
source: [27-VERIFICATION.md]
started: 2026-05-29T00:00:00Z
updated: 2026-05-29T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. RevenueBarChart visual appearance
expected: Bars render with accent color, CLP tooltip on hover, no Y-axis, no vertical grid lines, chart height 160px
result: [pending]

### 2. HomeSection approve/reject row removal
expected: After approving or rejecting a queue item, the row disappears from the list (real API call + state mutation)
result: [pending]

### 3. PaymentsSection CSV download
expected: Clicking "Exportar CSV" triggers browser download of real payments data as CSV file
result: [pending]

### 4. ReportsSection period chip re-buckets client-side
expected: Switching Día/Semana/Mes/Año chip updates chart without network requests
result: [pending]

### 5. ReportsSection empty-state panel
expected: When selected period has no PAID payments, chart shows empty state message
result: [pending]

### 6. GET /payments HTTP auth guards
expected: Unauthenticated request → 401; non-admin role → 403; admin JWT → 200 with data
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
