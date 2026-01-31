def validate(table, detected_total):
    # Sum only valid line totals
    line_totals = [
        row["line_total"]
        for row in table
        if row.get("line_total") is not None
    ]

    calculated_total = round(sum(line_totals), 2)

    # If no detected total from OCR
    if detected_total is None:
        return {
            "status": "CALCULATED_ONLY",
            "calculated_total": calculated_total,
            "message": f"Final total calculated as {calculated_total}"
        }

    # Compare detected vs calculated
    if abs(calculated_total - detected_total) < 1:
        return {
            "status": "MATCH",
            "calculated_total": calculated_total,
            "message": (
                f"Calculated total {calculated_total} "
                f"matches detected total {detected_total}"
            )
        }

    return {
        "status": "MISMATCH",
        "calculated_total": calculated_total,
        "message": (
            f"Calculated total {calculated_total} "
            f"does not match detected total {detected_total}"
        )
    }
