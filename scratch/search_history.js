const fs = require('fs');
const readline = require('readline');

async function search() {
  const fileStream = fs.createReadStream('C:\\Users\\panta\\.gemini\\antigravity\\brain\\524d729f-9962-4b5c-8870-f3b05f487c42\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let userInputs = [];
  let index = 0;
  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'USER_INPUT') {
        userInputs.push({ index, content: obj.content });
      }
    } catch (e) {
      // ignore
    }
    index++;
  }

  console.log("Found User Inputs:", JSON.stringify(userInputs.slice(-5), null, 2));
}

search();
