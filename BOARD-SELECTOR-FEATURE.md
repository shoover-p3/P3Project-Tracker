# Board Selector Feature

## Overview
Cards can now be easily moved between boards using a dropdown in the card modal. This works for both new and existing cards.

## Features

### 1. Board Selector Dropdown
Located in the card modal, right above the Assignee field.

**For New Cards:**
- Defaults to the current board you're viewing
- Can select any board before creating
- Card will be created on the selected board

**For Existing Cards:**
- Shows the card's current board
- Can change to any other board
- Shows notification when board will change

### 2. Visual Feedback
- Blue info message appears when changing boards: "ℹ️ This card will be moved to the selected board"
- Alert confirms the move after saving
- Card automatically appears/disappears from current view as appropriate

### 3. Use Cases

#### Creating Card on Wrong Board
1. On Board A, click "+ New Card"
2. Realize you want it on Board B
3. Change board dropdown to Board B
4. Create card
5. Card appears on Board B (get confirmation alert)

#### Moving Existing Cards
1. Click any card
2. Change board dropdown
3. Save
4. Card moves to new board
5. Card disappears from current board (if viewing old board)

#### Moving Archived Cards
1. Go to Archive
2. Click archived card
3. Can change board while also changing status
4. Works for unarchiving to different boards

### 4. Multiple Boards Workflow
Perfect for when:
- You create a new board and want to move relevant cards to it
- Reorganizing work between teams/projects
- Realizing a card belongs elsewhere
- Setting up new project structures

## Technical Implementation

### Components Modified
- **CardModal.tsx**
  - Added `boards` and `currentBoardId` props
  - Added board selector dropdown
  - Added boardId to save handler
  - Shows visual feedback for board changes

- **Board Page**
  - Passes boards list to modal
  - Handles board changes in save
  - Alerts when card moved to different board
  - Reloads cards after changes

- **Archive Page**
  - Same board selector functionality
  - Works when unarchiving cards
  - Can move and unarchive in one action

### API Changes
- **PUT /api/cards**
  - Accepts `board_id` parameter
  - Updates card's board via `updateCardBoard` function

- **Database (lib/db.ts)**
  - New function: `updateCardBoard(id, boardId)`
  - Updates card's `board_id` field

## How to Use

### Create Card on Specific Board
1. From any board, click "+ New Card"
2. **Select board** from dropdown (defaults to current)
3. Fill in card details
4. Save
5. Card created on selected board

### Move Existing Card to Another Board
1. Click card to open modal
2. **Change board** dropdown
3. Note the blue message confirming the move
4. Save
5. Card moves to new board
6. You get a confirmation message

### Move Multiple Cards to New Board
1. Create new board
2. Go to old board
3. Click first card → change board → save
4. Repeat for each card
5. All cards now on new board

### Move Archived Card When Unarchiving
1. Go to Archive
2. Click archived card
3. Change status to "In Progress" or "Not Started"
4. **Also change board if needed**
5. Save
6. Card unarchived to selected board

## Examples

### Example 1: Wrong Board
```
You're on "Research" board
Click "+ New Card"
Oops, this should be on "Development" board
Change dropdown: Research → Development
Save
→ Card appears on Development board
```

### Example 2: Reorganizing Project
```
Create new board: "Q1 Priorities"
Go to "Backlog" board
Click card "Important Feature"
Change board: Backlog → Q1 Priorities
Save
→ Card moves to Q1 Priorities
→ Alert: "Card moved to Q1 Priorities"
```

### Example 3: New Team Board
```
Create board: "Team Alpha"
Go to "General Tasks"
Move 5 cards to Team Alpha board
Team Alpha board now has their tasks
General Tasks board cleaned up
```

## Benefits

1. **Flexibility**: Realize mistakes before or after creation
2. **Reorganization**: Easy to restructure boards
3. **New Boards**: Populate new boards from existing cards
4. **Team Splits**: When splitting teams, move their cards
5. **Project Evolution**: As projects evolve, cards can follow
6. **No Data Loss**: Cards always saved, just change location

## Current Behavior

- Moving card away from current board → card disappears from view
- Moving card to current board → card appears in view
- Board selector shows all available boards
- Defaults intelligently (current board or card's board)
- Archive page supports board changes too
- Works seamlessly with drag & drop priority changes

## Testing Checklist

- [x] Create card on default board
- [ ] Create card on different board
- [ ] Edit card and change board
- [ ] Verify card appears on new board
- [ ] Verify card removed from old board
- [ ] Move archived card to different board while unarchiving
- [ ] Create new board and move cards to it
- [ ] Get confirmation alerts when moving boards
