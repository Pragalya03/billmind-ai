def validate(table, marked_total):
    calculated = sum(row["line_total"] for row in table)

    if marked_total is None:
        return {
            "status": "REVIEW",
            "message": "Handwritten total not found"
        }

    diff = abs(calculated - marked_total)

    if diff < 1:
        return {
            "status": "MATCH",
            "message": "Calculated total matches handwritten total"
        }

    if diff <= 5:
        return {
            "status": "PARTIAL_MATCH",
            "message": "Minor difference detected, possibly tax or rounding"
        }

    return {
        "status": "MISMATCH",
        "message": f"Calculated {calculated}, but handwritten total is {marked_total}"
    }
