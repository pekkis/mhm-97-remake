---
"mhm-97-remake": patch
---

Unify crisis meeting gating: the `Current` context-sensitive panel now
consumes the `canCrisisMeeting` selector instead of re-implementing its
own check, and the selector now reads effective team morale (post team
effects) so it matches the value the player sees on screen and the
disabled state of the "Pidä kriisipalaveri" button.
