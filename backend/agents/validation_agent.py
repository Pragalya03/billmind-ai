def validate(table, marked_total):
    calculated = sum(row["line_total"] for row in table)

    if marked_total is None:
        return {
            "status": "REVIEW",
            "message": "Total not found on bill"
        }

    if abs(calculated - marked_total) < 1:
        return {
            "status": "MATCH",
            "message": "Calculated total matches handwritten total"
        }

    return {
        "status": "MISMATCH",
        "message": f"Calculated {calculated}, but handwritten total is {marked_total}"
    }
