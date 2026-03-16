# Backend Update for Round Stats

Update your `/api/pipeline/round-stats` endpoint to return stats grouped by round instead of username:

```python
@pipeline_bp.route("/round-stats", methods=["GET"])
@jwt_required()
def round_stats():
    role = get_jwt().get("role")

    if role not in ["hr", "admin"]:
        return jsonify({"msg": "Access denied"}), 403

    cur = mysql.connection.cursor()
    
    # Get count of selected candidates in each round
    cur.execute("""
        SELECT rr.round, COUNT(*) as count
        FROM resume_rounds rr
        WHERE rr.status='selected'
        GROUP BY rr.round
    """)

    rows = cur.fetchall()
    cur.close()

    # Create stats dict with all rounds defaulting to 0
    stats = {
        'technical': 0,
        'hr_round': 0,
        'manager_round': 0
    }
    
    # Update with actual counts from database
    for round_name, count in rows:
        stats[round_name] = count

    return jsonify({"stats": stats})
```

This will return:
```json
{
  "stats": {
    "technical": 5,
    "hr_round": 3,
    "manager_round": 1
  }
}
```

Update your Flask pipeline blueprint with this corrected endpoint.
