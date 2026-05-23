# Components

This document describes UI components and their behavior.

## MatrixGrid

- Located at `src/components/MatrixGrid.tsx`.
- Client component that renders the task form and all quadrants.
- Handles task creation with `addTask` server action.
- Uses optimistic updates for drag/drop, complete, and delete actions.
- Manages local form state for urgency, importance, frequency, category, and reminder time.

## Quadrant

- Located at `src/components/Quadrant.tsx`.
- Client component representing one Eisenhower quadrant.
- Accepts dropped tasks and calls `onDropTask`.
- Renders `TaskCard` instances for tasks in the quadrant.

## TaskCard

- Located at `src/components/TaskCard.tsx`.
- Draggable task representation.
- Shows badges for frequency, prayer category, and reminder time.
- Provides buttons for marking done and deleting tasks.

## TaskReminders

- Located at `src/components/TaskReminders.tsx`.
- Client component providing browser notification support.
- Schedules reminders for tasks with `reminderTime`.
- For prayer tasks, fetches local prayer times from the Aladhan API.
- Requests notification permission and optionally uses geolocation.
- Refreshes reminders at midnight.

## DoneTaskList

- Located at `src/components/DoneTaskList.tsx`.
- Client component showing completed tasks.
- Supports restore and delete actions with optimistic updates.

## HistoryRangePicker

- Located at `src/components/HistoryRangePicker.tsx`.
- Client component for picking date ranges.
- Pushes `/history?start=YYYY-MM-DD&end=YYYY-MM-DD`.
- Defaults to the last 10 days.

## Layout

- `src/app/layout.tsx` defines the global page shell.
- Includes navigation links to `/`, `/done`, and `/history`.
- Applies global styling by importing `./globals.css`.
