# Flask Backend HR API Update

Replace or update your HR blueprint (hr.py) with this code to include username in the resumes endpoint:

```python
from flask import Blueprint, request, jsonify
from extensions import mysql
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

hr_bp = Blueprint("hr", __name__)


@hr_bp.route("/resumes", methods=["GET"])
@jwt_required()
def get_resumes():
    role = get_jwt().get("role")
    
    if role not in ["hr", "admin"]:
        return jsonify({"msg": "Access denied"}), 403
    
    cur = mysql.connection.cursor()
    
    cur.execute("""
        SELECT 
            r.id,
            r.user_id,
            u.name,
            u.email,
            r.file_name,
            r.status
        FROM resumes r
        JOIN users u ON r.user_id = u.id
        ORDER BY r.id DESC
    """)
    
    rows = cur.fetchall()
    cur.close()
    
    return jsonify({
        "resumes": [
            {
                "id": r[0],
                "user_id": r[1],
                "username": r[2],
                "email": r[3],
                "file_name": r[4],
                "status": r[5]
            }
            for r in rows
        ]
    })


@hr_bp.route("/review/<int:resume_id>", methods=["POST"])
@jwt_required()
def review_resume(resume_id):
    role = get_jwt().get("role")
    user_id = get_jwt_identity()
    
    if role not in ["hr", "admin"]:
        return jsonify({"msg": "Only HR/Admin can review"}), 403
    
    data = request.json
    status = data.get("status")  # 'shortlisted' or 'rejected'
    
    if status not in ["shortlisted", "rejected"]:
        return jsonify({"msg": "Invalid status"}), 400
    
    cur = mysql.connection.cursor()
    
    # Update resume status
    cur.execute("""
        UPDATE resumes
        SET status=%s
        WHERE id=%s
    """, (status, resume_id))
    
    mysql.connection.commit()
    cur.close()
    
    return jsonify({"msg": "Resume reviewed successfully"})
```

Make sure to:
1. Import this blueprint in your Flask app
2. Register it with: `app.register_blueprint(hr_bp, url_prefix="/api/hr")`
