# Lines with Tags

## Requirements
1. Dataview with DataviewJS turned on
2. Notes with cdate set and tags or metadata to show

## How to use
Install the plugin and enable it.
Then create a new code block like this:

```linesWithTags
start_date: 2024-07-10
end_date: 2024-07-30
tags: #therapy, mood_notes
folder_filter: "Ephemera" or "Evergreen"
```
This will go through all of your notes and display any notes that were created between `start_date` and `end_date` and also contain tags or metadata `tags` and also are in the folder `folder_filter`.

You can leave `folder_filter` and `start_date`\ `end_date` out if you like and it will still work.
That's it. Your results will look like

[[2024-07-13]]
- mood_notes:: {{the note}}

[[2024-07-14]]
- mood_notes: {{the note}}
- {{tagged content}} 
...

---

