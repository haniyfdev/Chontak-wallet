import secrets

# ------------------
def card_number_generation():
    digits = [secrets.randbelow(10) for _ in range(10)]
    juftlar = toqlar = 0
    for d in digits:
        if d % 2 == 0:
            juftlar += d
        else:
            toqlar += d
    juft = juftlar % 10
    toq = toqlar % 10
    digit_str = "".join(str(d) for d in digits) 
    card = (f"7777{digit_str}{toq}{juft}")
    return card

