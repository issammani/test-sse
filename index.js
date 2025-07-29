// sseServer.js — POST-only Express server with optional streaming support

const express = require('express');
const morgan = require('morgan');

const app = express();
const PORT = 3000;

// Middleware
app.use(morgan('dev'));
app.use(express.json());

// POST /chat/completions (streaming or non-streaming)
app.post('/chat/completions', (req, res) => {
  const stream = req.body.stream === true;
  const created = Math.floor(Date.now() / 1000);
  const model = req.body.model || 'test-model';

  console.log(`→ POST /chat/completions`);
  console.log('   Headers:', req.headers);
  console.log('   Body:', req.body);

  const chunks = [
    { id: "resp1", created, model, object: "chat.completion.chunk", choices: [{ index: 0, delta: { content: "Hello," } }] },
    { id: "resp1", created, model, object: "chat.completion.chunk", choices: [{ index: 0, delta: { content: " this" } }] },
    { id: "resp1", created, model, object: "chat.completion.chunk", choices: [{ index: 0, delta: { content: " is" } }] },
    { id: "resp1", created, model, object: "chat.completion.chunk", choices: [{ index: 0, delta: { content: " a" } }] },
    { id: "resp1", created, model, object: "chat.completion.chunk", choices: [{ index: 0, delta: { content: " streamed" } }] },
    { id: "resp1", created, model, object: "chat.completion.chunk", choices: [{ index: 0, delta: { content: " response." } }] }
  ];

  if (stream) {
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    let index = 0;
    const sendNext = () => {
      if (index < chunks.length) {
        const payload = JSON.stringify(chunks[index]);
        console.log(`→ streaming chunk[${index}]`, payload);
        res.write(`data: ${payload}\n\n`);
        index++;
        setTimeout(sendNext, 2000);
      } else {
        console.log('→ streaming [DONE]');
        res.write('data: [DONE]\n\n');
        res.end();
      }
    };

    sendNext();
  } else {
    // Standard (non-streaming) JSON response
    console.log('→ sending full JSON response');
    const fullContent = chunks.map(c => c.choices[0].delta.content).join('');
    res.json({
      id: "resp1",
      created,
      model,
      object: "chat.completion",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: fullContent },
          finish_reason: "stop"
        }
      ]
    });
  }
});

app.listen(PORT, () => {
  console.log(`✔ SSE server running on http://localhost:${PORT}`);
});
