# Patch Update Log

## 2026-02-16 Update
- Updated script `create_patch_recent.ps1` to default to 3 days (4320 minutes) and support accumulation.
- Copied files modified in the last 3 days to `GITHUB_PATCH`.
- Files included:
  - `blind_proposal.html`
  - `controllers/proposalController.js`
  - `js/blind_proposal.js`
  - `js/modules/proposal_handler.js`
  - And potentially others modified recently.

## How to use
To add future changes to this patch folder, simply run:
```powershell
.\create_patch_recent.ps1
```
This will copy any files modified in the last 3 days to this folder, overwriting older versions but keeping other files intact.
