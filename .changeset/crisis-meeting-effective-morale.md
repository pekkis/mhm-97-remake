---
"mhm-97-remake": patch
---

Fix the "Kriisipalaveri" alert in the context-sensitive sidebar so it gates on effective morale (`getEffective(team).morale`) against `CRISIS_MORALE_MAX`, matching the menu link and the actual crisis-meeting availability. Previously the alert read raw `team.morale` against a hardcoded `-3`, so it could nag for a meeting whose link wasn't there — or stay silent when one was.
