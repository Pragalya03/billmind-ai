def bbox_center(bbox):
    xs = [p[0] for p in bbox]
    ys = [p[1] for p in bbox]
    return sum(xs) / 4, sum(ys) / 4
