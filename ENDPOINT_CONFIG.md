# Python Endpoint Configuration Guide

## Quick Setup

The chatbot can consume your existing Python endpoint in two ways:

### Option 1: Direct REST API Call (Recommended)

1. Create a `.env` file in the root directory:
```env
VITE_PYTHON_API_ENDPOINT=http://localhost:8000/api/chat
VITE_USE_GRAPHQL=false
```

2. Your Python endpoint should accept POST requests with this format:

**Request:**
```json
{
  "query": "user's question",
  "conversation_id": "optional_conversation_id"
}
```

**Response (choose one format):**
```json
{
  "response": "Your AI response here",
  "id": "optional_response_id",
  "timestamp": "2024-01-01T12:00:00",
  "conversation_id": "optional_conversation_id"
}
```

OR

```json
{
  "message": "Your AI response here"
}
```

OR

```json
{
  "text": "Your AI response here"
}
```

OR

```json
{
  "answer": "Your AI response here"
}
```

The service will automatically detect and use any of these response formats.

### Option 2: Through GraphQL Middleware

If you want to use GraphQL as middleware:

1. Create a `.env` file:
```env
VITE_GRAPHQL_ENDPOINT=http://localhost:8000/graphql
VITE_USE_GRAPHQL=true
```

2. Your GraphQL endpoint should support the query defined in `src/services/graphql/queries.ts`

## Customizing the Request Format

If your Python endpoint expects a different request format, edit `src/services/api/chatbot.service.ts`:

```typescript
// In the callPythonEndpoint function, modify the request body:
body: JSON.stringify({
  // Your custom format here
  message: query,
  user_input: query,
  // etc.
}),
```

## Customizing the Response Mapping

If your Python endpoint returns a different response format, edit the response mapping in `src/services/api/chatbot.service.ts`:

```typescript
// In the callPythonEndpoint function, modify the return statement:
return {
  id: data.id || `resp_${Date.now()}`,
  response: data.your_custom_field || data.another_field,
  query: query,
  cached: false,
  timestamp: data.timestamp || new Date().toISOString(),
  conversationId: conversationId || data.conversation_id,
}
```

## Example Python Endpoint (Flask)

```python
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    query = data.get('query', '')
    conversation_id = data.get('conversation_id')
    
    # Your AI/ML processing here
    response_text = your_ai_service.process(query)
    
    return jsonify({
        'response': response_text,
        'id': f'resp_{int(time.time())}',
        'timestamp': datetime.now().isoformat(),
        'conversation_id': conversation_id
    })

if __name__ == '__main__':
    app.run(port=8000)
```

## Example Python Endpoint (FastAPI)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str
    conversation_id: str = None

class ChatResponse(BaseModel):
    response: str
    id: str
    timestamp: str
    conversation_id: str = None

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # Your AI/ML processing here
    response_text = your_ai_service.process(request.query)
    
    return ChatResponse(
        response=response_text,
        id=f"resp_{int(datetime.now().timestamp())}",
        timestamp=datetime.now().isoformat(),
        conversation_id=request.conversation_id
    )
```

## Caching

Responses are automatically cached for 5 minutes. If you ask the same question again within 5 minutes, it will return the cached response instantly without calling your Python endpoint.

## Testing

1. Start your Python backend
2. Start the frontend: `npm run dev`
3. Open the chatbot and type a message
4. Check the browser console for any errors
5. Check the Network tab to see the API call

## Troubleshooting

### CORS Errors
Make sure your Python backend has CORS enabled and allows requests from `http://localhost:5173`

### 404 Errors
- Verify your endpoint URL in `.env` matches your Python backend
- Check that your Python backend is running
- Verify the endpoint path is correct

### Response Format Errors
- Check the browser console for the actual response format
- Update the response mapping in `chatbot.service.ts` to match your format

