def validate(table, detected_total):
    """
    Validation logic:
    - Final total is ALWAYS calculated from line totals
    - Detected OCR total is used ONLY for comparison
    """

    # Calculate final total from line items
    line_totals = [
        row["line_total"]
        for row in table
        if row.get("line_total") is not None
    ]

    calculated_total = round(sum(line_totals), 2)

    print("\n--- VALIDATION AGENT DEBUG ---")
    print("Line totals:", line_totals)
    print("Calculated final total:", calculated_total)
    print("Detected OCR total:", detected_total)

    # No OCR total detected
    if detected_total is None:
        return {
            "status": "NO_OCR_TOTAL",
            "calculated_total": calculated_total,
            "message": (
                f"Final total calculated as {calculated_total}. "
                f"No handwritten total detected for comparison."
            )
        }

    # OCR total detected → compare
    if abs(calculated_total - detected_total) < 1:
        return {
            "status": "MATCH",
            "calculated_total": calculated_total,
            "message": (
                f"Final total {calculated_total} matches "
                f"the detected handwritten total {detected_total}."
            )
        }

    return {
        "status": "MISMATCH",
        "calculated_total": calculated_total,
        "message": (
            f"Final total {calculated_total} does NOT match "
            f"the detected handwritten total {detected_total}."
        )
    }
