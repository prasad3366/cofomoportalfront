# Backend Signup Update Required

Your frontend is sending `role` in the signup request, but your backend signup endpoint doesn't accept it.

## Update your backend signup to this:

```python
@auth_bp.route("/signup", methods=["POST"])
def signup():
    try:
        data = request.json

        name = data.get("name")
        email = data.get("email")
        phone = data.get("phone")
        password_raw = data.get("password")
        role = data.get("role", "candidate")  # ✅ Added this line

        # Basic validation
        if not all([name, email, phone, password_raw]):
            return jsonify({"msg": "All fields are required"}), 400

        if not phone.isdigit() or len(phone) != 10:
            return jsonify({"msg": "Invalid phone number"}), 400

        hashed_password = bcrypt.hashpw(
            password_raw.encode(),
            bcrypt.gensalt()
        )

        cur = mysql.connection.cursor()

        # Check duplicate email or phone
        cur.execute(
            "SELECT id FROM users WHERE email=%s OR phone=%s",
            (email, phone)
        )
        existing = cur.fetchone()

        if existing:
            return jsonify({"msg": "Email or phone already registered"}), 400

        # Insert new user with role ✅ Added role to INSERT
        cur.execute(
            "INSERT INTO users(name, email, phone, password, role) VALUES(%s,%s,%s,%s,%s)",
            (name, email, phone, hashed_password, role)
        )

        mysql.connection.commit()
        cur.close()

        return jsonify({"msg": "User created successfully"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
```

## Changes Made:
1. ✅ Added `role = data.get("role", "candidate")` - Get role from request, default to "candidate"
2. ✅ Updated INSERT to include role: `INSERT INTO users(name, email, phone, password, role)`
3. ✅ Added role to the tuple: `(name, email, phone, hashed_password, role)`

This way when users sign up with a specific role (Candidate, HR, Admin), it gets stored in the database and returned on login!
