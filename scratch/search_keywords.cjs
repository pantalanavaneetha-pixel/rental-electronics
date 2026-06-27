const fs = require('fs');
const readline = require('readline');

async function search() {
  const fileStream = fs.createReadStream('C:\\Users\\panta\\.gemini\\antigravity\\brain\\524d729f-9962-4b5c-8870-f3b05f487c42\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const keywords = ["blueprint", "layout contract", "zero-ambiguity", "engineering prompts", "state-and-markup"];
  let index = 0;
  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      const text = JSON.stringify(obj).toLowerCase();
      const match = keywords.find(kw => text.includes(kw));
      if (match) {
        console.log(`Step ${obj.step_index || index} matched keyword: "${match}" (type: ${obj.type})`);
        if (obj.type === 'USER_INPUT') {
          console.log("USER INPUT:", obj.content.substring(0, 1000));
        } else if (obj.type === 'PLANNER_RESPONSE' && obj.content) {
          console.log("PLANNER RESPONSE:", obj.content.substring(0, 1000));
        }
        console.log("==================================================\n");
      }
    } catch (e) {
      // ignore
    }
    index++;
  }
}

search();
