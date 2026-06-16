const fs = require('fs');
const readline = require('readline');

async function search() {
  const fileStream = fs.createReadStream('C:\\Users\\panta\\.gemini\\antigravity\\brain\\524d729f-9962-4b5c-8870-f3b05f487c42\\.system_generated\\logs\\transcript_full.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let index = 0;
  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.step_index === 2011) {
        console.log("Found step 2011 full:", JSON.stringify(obj, null, 2));
      }
    } catch (e) {
      // ignore
    }
    index++;
  }
}

search();
