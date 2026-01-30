def detect(items):
    errors = []
    suggestions = []

    numbers = []
    for i in items:
        if i["text"].replace(".", "").isdigit():
            numbers.append(float(i["text"]))

    if len(numbers) >= 3:
        total = max(numbers)
        others = [n for n in numbers if n != total]

        for i in range(len(others)):
            for j in range(i + 1, len(others)):
                if abs(others[i] * others[j] - total) < 1:
                    suggestions.append(
                        f"Suggested correction: {int(others[i])} × {int(others[j])} = {int(total)}"
                    )

        subtotal = sum(others)
        if abs(subtotal - total) > 1:
            errors.append(
                f"Possible total mismatch: detected total {total}, subtotal {subtotal}"
            )

    return {
        "errors": errors,
        "suggestions": suggestions
    }
