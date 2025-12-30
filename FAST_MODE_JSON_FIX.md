# Fast Mode JSON Response Fix

## Problem Identified
When using fast mode, agents were returning JSON-formatted text in the `response` field instead of user-friendly markdown, even after implementing the response formatter.

## Root Cause
The `prompt-manager.js` was explicitly instructing the LLM to **"RESPOND WITH STRUCTURED JSON"** in fast mode prompts. This caused the LLM to return JSON text, which was then formatted as markdown (but still contained JSON structure).

## Solution Applied
Updated all fast mode prompts in `src/utils/prompt-manager.js` to request **plain text narrative** instead of JSON:

### Changed:
```javascript
// BEFORE - Requested JSON
RESPOND WITH STRUCTURED JSON:
{
  "diagnosis": { ... },
  "immediate_actions": [...],
  ...
}
```

### To:
```javascript
// AFTER - Requests plain text
Provide a concise clinical assessment in plain text covering:
- Most likely diagnosis and differential diagnoses
- Immediate actions recommended
- Any red flags or urgent concerns
...
Format: Plain text narrative, NOT JSON.
```

## Files Modified
- `src/utils/prompt-manager.js`
  - `getFastPrompt()` - General fast mode prompt
  - `getTriagePrompt()` - Triage-specific fast mode
  - `getPainPrompt()` - Pain assessment fast mode
  - `getMovementPrompt()` - Movement analysis fast mode
  - `getStrengthPrompt()` - Strength assessment fast mode
  - `getMindPrompt()` - Psychological assessment fast mode

## How It Works Now

### Fast Mode Flow:
1. **Prompt Manager** requests plain text from LLM (NOT JSON)
2. **LLM** returns clinical narrative in plain text
3. **Agent** receives plain text in `rawResponse`
4. **Formatter** (`formatUserFriendlyResponse()`) converts structured data + raw text into polished markdown
5. **Response field** contains user-ready markdown

### Normal Mode Flow:
1. **Agent** uses full system prompt (always plain text)
2. **LLM** returns detailed clinical assessment
3. **Formatter** converts to markdown
4. **Response field** contains user-ready markdown

## Testing
After this fix, fast mode responses will be plain text narratives that get formatted into professional markdown, not JSON structures.

To test:
```bash
# Run a fast mode consultation
curl -X POST http://localhost:3000/consultation \
  -H "Content-Type: application/json" \
  -d '{
    "caseData": {"symptoms": "knee pain", "painLevel": 6},
    "requiredSpecialists": ["triage"],
    "options": {"mode": "fast"}
  }'
```

Expected `response` field format:
```markdown
# Triage Agent Assessment

## Summary

- Initial triage assessment completed
- Urgency level: routine
...
```

NOT:
```json
{"urgency": "routine", "specialists_needed": [...], ...}
```

## Why This Matters
- ✅ Consistent response format across all modes (fast and normal)
- ✅ User-friendly markdown ready for direct display
- ✅ No JSON parsing needed on frontend
- ✅ Professional, readable clinical narratives
- ✅ Structured data still preserved in other fields

## Additional Notes
- Learning mode still uses JSON internally for agent learning/pattern recognition
- Normal mode was never affected (never requested JSON)
- All structured fields (`assessment`, `recommendations`, etc.) remain unchanged
- Frontend can display `response` field directly as markdown
