
# Run and deploy the app

This repository contains a local development setup for the career portal.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy the example env file and provide your backend values:

``bash
cp .env.example .env.local
# then edit .env.local and set your values
``

Or create `.env.local` with:

```
SERVICE_API_URL=https://api.example.com
SERVICE_API_KEY=your_key_here
```

3. Run the app:
   `npm run dev`

Backend notes (Flask)

- Your Flask auth endpoints should return a JSON object with an `access_token` and optional `user` object on successful login/signup. Example successful response:

``json
{ "access_token": "<jwt>", "user": { "id": "u1", "name": "Alice", "email": "alice@example.com", "role": "CANDIDATE" } }
```

- If the backend returns only `access_token`, the frontend will call `GET /auth/me` to fetch the user profile. Ensure your Flask app exposes `/auth/me` that returns `{ "user": { ... } }` for the current token.

- Enable CORS in your Flask app during development (e.g., `flask-cors`) and configure the JWT secret and token expiry. A minimal Flask sketch:

```py
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your-secret'
CORS(app)
jwt = JWTManager(app)

@app.route('/auth/me')
@jwt_required()
def me():
   user_id = get_jwt_identity()
   # look up user in DB and return
   return jsonify({ 'user': { 'id': user_id, 'name': 'Alice', 'email': 'alice@example.com', 'role': 'CANDIDATE' } })
```

Place your backend URL in `.env.local` as `SERVICE_API_URL` (e.g. `http://localhost:5000`). The frontend will store the JWT in `localStorage` and include it on API requests.
