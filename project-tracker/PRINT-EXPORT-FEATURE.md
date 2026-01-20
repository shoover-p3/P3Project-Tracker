# Print & Export Features

## Overview
Reports can now be printed cleanly (without sidebar/navigation) and exported to Excel (.xlsx) or CSV (.csv) formats.

## Print Functionality

### What's Improved
- **Sidebar hidden** when printing (no navigation clutter)
- **TopBar hidden** when printing (no search box, buttons)
- **Full-width content** when printing
- **Clean page breaks** for multi-page reports
- **White background** for professional printing

### How to Use
1. Go to Print/Reports page
2. Select report type and filters
3. Click "Print Report" button
4. Print dialog opens with clean layout
5. Print or save as PDF

### Print Layout
```
┌─────────────────────────────────────┐
│  Report Title                       │
│  Generated: [Date]                  │
│  Total Cards: X                     │
├─────────────────────────────────────┤
│                                     │
│  [Board Name]                       │
│  ─────────────                      │
│  High Priority (X)                  │
│    • Card title                     │
│      @assignee • status             │
│                                     │
│  Medium Priority (X)                │
│    • Card title                     │
│                                     │
└─────────────────────────────────────┘
```

No sidebar, no buttons, no distractions - just the report.

---

## Export to Excel (.xlsx)

### Features
- **Full card data** in spreadsheet format
- **One row per card**
- **Sortable columns**
- **Open in Excel/Google Sheets**
- **Smart filename** with date and filter type

### Exported Columns
1. Board
2. Title
3. Description
4. Priority
5. Status
6. Assignee
7. Created (date)
8. Updated (date)

### Filename Format
```
project-tracker-[filter-type]-[date].xlsx

Examples:
- project-tracker-by-boards-2026-01-20.xlsx
- project-tracker-by-priority-2026-01-20.xlsx
- project-tracker-by-user-Shane-2026-01-20.xlsx
- project-tracker-summary-2026-01-20.xlsx
```

### How to Use
1. Go to Print/Reports page
2. Select report type and filters
3. Click "Export Excel" button (green)
4. File downloads automatically
5. Open in Excel/Google Sheets

### Use Cases
- **Pivot tables** in Excel
- **Advanced filtering** by multiple criteria
- **Charts and graphs** from card data
- **Share with stakeholders** who prefer spreadsheets
- **Archive snapshots** of project state

---

## Export to CSV (.csv)

### Features
- **Plain text format** (universal compatibility)
- **Same data as Excel** export
- **Opens in Excel, Google Sheets, or text editor**
- **Easy to import** into other tools
- **Smaller file size** than Excel

### Format
```csv
"Board","Title","Description","Priority","Status","Assignee","Created","Updated"
"Research","Analyze competitor data","Full analysis of...","high","in progress","Shane","1/20/2026","1/20/2026"
"Development","Build API","REST API for...","medium","not started","Unassigned","1/19/2026",""
```

### Filename Format
Same as Excel:
```
project-tracker-[filter-type]-[date].csv
```

### How to Use
1. Go to Print/Reports page
2. Select report type and filters
3. Click "Export CSV" button (gray)
4. File downloads automatically
5. Open in any spreadsheet app

### Use Cases
- **Import to other tools** (Jira, databases, etc.)
- **Version control** (CSV is text, can be git-tracked)
- **Email-friendly** (smaller files)
- **Script processing** (easier to parse than Excel)
- **Universal compatibility** (opens anywhere)

---

## Export Includes Current Filters

**Important**: Exports respect your current filters!

### Examples

**Scenario 1: Specific Boards**
```
1. Filter Type: By Boards
2. Select: Research, Development
3. Export Excel
→ File contains only cards from those 2 boards
```

**Scenario 2: High Priority Only**
```
1. Filter Type: By Priority
2. Select: High
3. Export CSV
→ File contains only high-priority cards
```

**Scenario 3: User's Work**
```
1. Filter Type: By User
2. Select: Shane
3. Export Excel
→ File contains only Shane's cards across all boards
```

**Scenario 4: Accomplishments**
```
1. Filter Type: Summary
2. Start Date: 2026-01-01
3. End Date: 2026-01-31
4. Export Excel
→ File contains only completed cards from January
```

---

## All Three Options Together

```
┌──────────────────────────────────────────────┐
│ Report Filters (select your filters above)   │
├──────────────────────────────────────────────┤
│                                              │
│ [🖨 Print Report]  [📊 Export Excel]  [📄 Export CSV] │
│                                              │
└──────────────────────────────────────────────┘
```

Choose based on your need:
- **Print** → Hard copy or PDF for meetings
- **Excel** → Analysis, charts, pivot tables
- **CSV** → Import to other tools, version control

---

## Technical Details

### Print Styles
Uses CSS `@media print` to:
- Hide `.print:hidden` elements
- Make content full-width
- Remove backgrounds and shadows
- Enable proper page breaks

### Excel Export
- Uses `xlsx` library
- Creates proper Excel workbook
- Single sheet: "Cards"
- Downloads via browser

### CSV Export
- Pure JavaScript implementation
- Properly escapes commas and quotes
- UTF-8 encoding
- Downloads via Blob

### Data Included
Both exports include:
- All visible card data
- Board associations
- Dates (created/updated)
- Status and priority
- Assignee information

### What's NOT Included
Exports don't include:
- Card positions (order within columns)
- Card IDs
- Board IDs
- Raw timestamps

---

## Common Workflows

### Weekly Review Meeting
1. Filter Type: Summary
2. Date Range: Last 7 days
3. Print Report → Discuss in meeting
4. Export Excel → Email to stakeholders

### Client Update
1. Filter Type: By Boards
2. Select: Client Project boards
3. Export Excel → Professional deliverable

### Personal Todo List
1. Filter Type: By User
2. Select: Your name
3. Export CSV → Import to personal task manager

### Quarterly Retrospective
1. Filter Type: Summary
2. Date Range: Q1 (Jan-Mar)
3. Export Excel → Build charts showing progress

---

## Tips

**For Excel Users:**
- Create pivot tables from exports
- Filter by multiple columns simultaneously
- Use formulas to calculate metrics
- Create charts from status/priority data

**For CSV Users:**
- Import into databases
- Process with Python/scripts
- Track in version control
- Import to other PM tools

**For Printing:**
- Save as PDF for archiving
- Print landscape for wider reports
- Adjust print scale if needed (usually 100% is fine)

---

## File Management

**Automatic Naming:**
Files automatically include:
- Current date (YYYY-MM-DD format)
- Filter type description
- User name (if filtered by user)

**Example Files:**
```
Downloads/
  project-tracker-by-boards-2026-01-20.xlsx
  project-tracker-by-priority-2026-01-20.csv
  project-tracker-by-user-Shane-2026-01-20.xlsx
  project-tracker-summary-2026-01-15.xlsx
```

**Organization:**
Create folders by:
- Month (for weekly exports)
- Quarter (for reviews)
- Board (for specific projects)

---

## Testing Checklist

- [x] Print shows no sidebar
- [x] Print shows no topbar
- [x] Print has clean page breaks
- [ ] Excel export downloads
- [ ] Excel opens in Excel/Sheets
- [ ] Excel has correct data
- [ ] CSV export downloads
- [ ] CSV opens in spreadsheet
- [ ] CSV has correct formatting
- [ ] Filename includes date and filter type
- [ ] Filters apply to exports
- [ ] All report types export correctly
