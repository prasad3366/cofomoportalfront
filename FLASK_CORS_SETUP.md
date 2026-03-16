# Flask Backend CORS Configuration Guide

## Problem
The frontend is getting a CORS error when trying to communicate with the Flask backend because CORS headers are not configured.

## Solution

### Install flask-cors
```bash
pip install flask-cors
```

### Update Your Flask App

Add this code at the **top** of your main Flask file (before registering blueprints):

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
from extensions import mysql
import bcrypt
from flask_jwt_extended import JWTManager, create_access_token
from routes.auth import auth_bp  # Your auth blueprint

app = Flask(__name__)

# ===== CORS Configuration =====
CORS(app, 
    resources={
        r"/*": {
            "origins": [
                "http://localhost:3000",
                "http://localhost:5173", 
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173"
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "max_age": 3600
        }
    }
)

# ===== JWT Configuration =====
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-this'
jwt = JWTManager(app)

# ===== Register Blueprints =====
app.register_blueprint(auth_bp)

# ===== Run App =====
if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
```

### Important Points:

1. **CORS must be imported and configured BEFORE registering blueprints**
2. **Adjust origins list based on where your frontend is running:**
   - `http://localhost:3000` - if using port 3000
   - `http://localhost:5173` - if using Vite default port
   - `http://127.0.0.1:5000` - if running locally with IP

3. **Check Your Frontend Port:**
   Open your browser console and look for the log that says:
   ```
   🔌 API Base URL: http://127.0.0.1:5000
   📍 Environment URL: http://127.0.0.1:5000
   ```

4. **If still getting CORS error, the frontend origin might be different.** Check the browser error:
   ```
   Access to fetch at 'http://127.0.0.1:5000/auth/login' from origin 'http://YOUR-ACTUAL-ORIGIN'
   ```
   And add that origin to the `origins` list in CORS config.

### Testing

1. **Restart your Flask server** with the new code
2. **Refresh your frontend** (Ctrl+Shift+R to clear cache)
3. **Try logging in** - it should work now!

### Debugging Commands

Check if Flask is running:
```bash
# Windows
netstat -ano | findstr :5000

# Mac/Linux
lsof -i :5000
```

Check if CORS is working:
```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://127.0.0.1:5000/auth/login -v
```
