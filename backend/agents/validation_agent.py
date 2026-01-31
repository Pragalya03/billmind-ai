def validate(table, detected_total):
    # Only include rows that have a computed line_total
    valid_rows = [row for row in table if row["line_total"] is not None]

    calculated = sum(row["line_total"] for row in valid_rows)

    if detected_total is None:
        return {
            "status": "UNKNOWN",
            "message": "Total not detected in bill"
        }

    if abs(calculated - detected_total) < 1:
        return {
            "status": "MATCH",
            "message": f"Calculated total {calculated} matches detected total"
        }

    return {
        "status": "MISMATCH",
        "message": (
            f"Calculated total {calculated} does not match detected total {detected_total}"
        )
    }