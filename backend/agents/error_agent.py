def detect(items):
    errors = []

    numbers = []
    for i in items:
        if i["text"].replace(".", "").isdigit():
            numbers.append(float(i["text"]))

    if len(numbers) >= 2:
        total = max(numbers)
        subtotal = sum(n for n in numbers if n != total)

        if abs(total - subtotal) > 1:
            errors.append(
                f"Possible total mismatch: detected total {total}, subtotal {subtotal}"
            )

    return errors
