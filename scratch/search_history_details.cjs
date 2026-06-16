const fs = require('fs');
const readline = require('readline');

async function search() {
  const fileStream = fs.createReadStream('C:\\Users\\panta\\.gemini\\antigravity\\brain\\524d729f-9962-4b5c-8870-f3b05f487c42\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let index = 0;
  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      // Let's look for user inputs or plans referencing "today's return"
      const contentStr = JSON.stringify(obj);
      if (contentStr.toLowerCase().includes("today's return devices") || contentStr.toLowerCase().includes("today’s return devices")) {
        console.log(`Step ${obj.step_index || index} has it:`);
        if (obj.type === 'USER_INPUT') {
          console.log("USER_INPUT:", obj.content);
        } else if (obj.type === 'PLANNER_RESPONSE' && obj.content) {
          console.log("PLANNER_RESPONSE excerpt:", obj.content.substring(0, 300));
        } else if (obj.tool_calls) {
          console.log("Tool calls:", JSON.stringify(obj.tool_calls).substring(0, 300));
        }
        console.log("----------------------------------------");
      }
    } catch (e) {
      // ignore
    }
    index++;
  }
}

search();
