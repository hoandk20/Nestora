"""Tạo mô hình 3D (GLB) cho 12 mẫu gối NESTORA, bám theo ảnh sản phẩm và bảng thông số (đơn vị mét).

Chi tiết: vân vải (cotton, dệt kim, lưới, trần bông, nhung), nếp nhăn, đường viền ống,
khóa kéo, tem nhãn, phối màu nhiều mảng.

Chạy:  pip install trimesh numpy pillow && python3 tools/gen_models.py
Kết quả: assets/models/n01.glb ... n12.glb
"""
import os
import numpy as np
import trimesh
from PIL import Image
from trimesh.visual.material import PBRMaterial

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "models")
os.makedirs(OUT, exist_ok=True)


# ================================================================ textures (normal maps)
def normal_from_height(h, strength):
    gy, gx = np.gradient(h)
    n = np.stack([-gx * strength, -gy * strength, np.ones_like(h)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return Image.fromarray(((n * 0.5 + 0.5) * 255).astype(np.uint8), "RGB")


def tileable_noise(size, cells, seed):
    g = np.random.default_rng(seed).random((cells, cells))
    x = np.linspace(0, cells, size, endpoint=False)
    xi = x.astype(int)
    xf = x - xi
    xf = xf * xf * (3 - 2 * xf)
    a = g[np.ix_(xi % cells, xi % cells)]
    b = g[np.ix_(xi % cells, (xi + 1) % cells)]
    c = g[np.ix_((xi + 1) % cells, xi % cells)]
    d = g[np.ix_((xi + 1) % cells, (xi + 1) % cells)]
    fy, fx = np.meshgrid(xf, xf, indexing="ij")
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def fabric_texture(kind, size=256):
    y, x = np.mgrid[0:size, 0:size] / size
    if kind == "weave":  # cotton dệt
        X, Y = x * 16, y * 16
        over = ((np.floor(X) + np.floor(Y)) % 2).astype(float)
        h = over * np.sin(np.pi * (X % 1)) ** 0.6 + (1 - over) * np.sin(np.pi * (Y % 1)) ** 0.6
        s = 2.2
    elif kind == "knit":  # dệt kim chữ V
        X, Y = x * 16, y * 16
        h = np.abs(np.sin(np.pi * (X + 0.5 * np.abs(np.sin(np.pi * Y))))) * np.sin(np.pi * (Y % 1)) ** 0.5
        s = 2.8
    elif kind == "mesh":  # vải lưới thoáng khí
        X, Y = x * 16, y * 16
        h = np.clip(np.hypot((X % 1) - 0.5, (Y % 1) - 0.5) * 3 - 0.6, 0, 1)
        s = 4.0
    elif kind == "quilt":  # trần bông hình thoi + thớ vải
        X, Y = x * 4, y * 4
        u, v = (X + Y) % 1, (X - Y) % 1
        line = np.minimum(np.minimum(u, 1 - u), np.minimum(v, 1 - v))
        h = np.clip(line * 6, 0, 1) ** 0.5 * 1.6
        h += 0.08 * np.sin(np.pi * x * 64) ** 2
        s = 6.0
    else:  # velvet: nhung mịn
        h = np.zeros_like(x)
        s = 1.2
    h = h + 0.35 * tileable_noise(size, 8, len(kind)) + 0.15 * tileable_noise(size, 32, len(kind) + 9)
    return normal_from_height(h, s)


TEX = {k: fabric_texture(k) for k in ("weave", "knit", "mesh", "quilt", "velvet")}


def srgb_lin(hexstr, mul=1.0):
    h = hexstr.lstrip("#")
    return [min(1.0, int(h[i:i + 2], 16) / 255 * mul) ** 2.2 for i in (0, 2, 4)] + [1.0]


def material(hexstr, tex="weave", rough=0.95, metal=0.0, mul=1.0):
    m = PBRMaterial(baseColorFactor=srgb_lin(hexstr, mul), roughnessFactor=rough, metallicFactor=metal)
    if tex:
        m.normalTexture = TEX[tex]
    return m


ZIP = dict(tex=None, rough=0.45, metal=0.6)
# tỷ lệ lặp vân theo từng loại vải (lần lặp / mét)
UV = {"weave": 28.0, "knit": 14.0, "mesh": 22.0, "quilt": 7.0, "velvet": 10.0}


# ================================================================ geometry helpers
def spow(x, e):
    return np.sign(x) * np.abs(x) ** e


def grid_mesh(P):
    nv, nu, _ = P.shape
    faces = []
    for i in range(nv - 1):
        for j in range(nu):
            a, b = i * nu + j, i * nu + (j + 1) % nu
            c, d = (i + 1) * nu + j, (i + 1) * nu + (j + 1) % nu
            faces += [[a, c, b], [b, c, d]]
    m = trimesh.Trimesh(P.reshape(-1, 3), np.array(faces), process=True)
    m.merge_vertices()
    m.update_faces(m.nondegenerate_faces())
    if m.volume < 0:
        m.invert()
    return m


def superquadric(w, d, h, e_vert, e_horiz, nu=180, nv=91):
    eta = np.linspace(-np.pi / 2, np.pi / 2, nv)[:, None]
    om = np.linspace(-np.pi, np.pi, nu, endpoint=False)[None, :]
    x = w / 2 * spow(np.cos(eta), e_vert) * spow(np.cos(om), e_horiz)
    y = d / 2 * spow(np.cos(eta), e_vert) * spow(np.sin(om), e_horiz)
    z = h / 2 * spow(np.sin(eta), e_vert) * np.ones_like(om)
    return np.stack([x, y, z], -1)


def tube(points, r, closed=True, n=12, flat=1.0):
    pts = np.asarray(points, float)
    tang = (np.roll(pts, -1, 0) - np.roll(pts, 1, 0)) if closed else np.gradient(pts, axis=0)
    tang /= np.linalg.norm(tang, axis=1, keepdims=True)
    side = np.cross(tang, [0, 0, 1.0])
    side /= np.linalg.norm(side, axis=1, keepdims=True) + 1e-9
    nrm = np.cross(side, tang)
    ang = np.linspace(0, 2 * np.pi, n, endpoint=False)
    P = pts[:, None, :] + (np.cos(ang)[None, :, None] * side[:, None, :] * r +
                           np.sin(ang)[None, :, None] * nrm[:, None, :] * r * flat)
    m = len(pts)
    faces = []
    for i in range(m if closed else m - 1):
        for j in range(n):
            a, b = i * n + j, i * n + (j + 1) % n
            c, d = ((i + 1) % m) * n + j, ((i + 1) % m) * n + (j + 1) % n
            faces += [[a, b, c], [b, d, c]]
    verts = P.reshape(-1, 3)
    if not closed:
        c0, c1 = len(verts), len(verts) + 1
        verts = np.vstack([verts, pts[0], pts[-1]])
        for j in range(n):
            faces += [[c0, (j + 1) % n, j], [c1, (m - 1) * n + j, (m - 1) * n + (j + 1) % n]]
    mesh = trimesh.Trimesh(verts, np.array(faces), process=True)
    if mesh.volume < 0:
        mesh.invert()
    return mesh


def box(ext, center, rot_z=0.0):
    b = trimesh.creation.box(extents=ext)
    b.apply_transform(trimesh.transformations.rotation_matrix(rot_z, [0, 0, 1]))
    b.apply_translation(center)
    return b


def split_by(mesh, fn):
    sel = fn(mesh.triangles_center)
    return (mesh.submesh([np.where(sel)[0]], append=True),
            mesh.submesh([np.where(~sel)[0]], append=True))


def edge_points(rim, side, frac):
    """Lấy đoạn đường may dọc một cạnh: side = '+x' (cạnh ngắn) hoặc '-y' (cạnh dài phía trước)."""
    ax, sgn = (0, 1) if side == "+x" else (1, -1)
    other = 1 - ax
    v = rim[:, ax] * sgn
    pts = rim[v > v.max() * 0.9]
    pts = pts[np.argsort(pts[:, other])]
    lim = (pts[:, other].max() - pts[:, other].min()) * frac / 2
    return pts[np.abs(pts[:, other]) < lim]


def zipper(rim, side="+x", frac=0.62, out=0.003, color="#9C979B"):
    pts = edge_points(rim, side, frac)
    n = np.zeros(3)
    n[0 if side == "+x" else 1] = out if side == "+x" else -out
    pts = pts + n
    z = tube(pts, 0.0045, closed=False, n=8, flat=0.45)
    tab = [0.004, 0.022, 0.007] if side == "+x" else [0.022, 0.004, 0.007]
    pull = box(tab, pts[-1] + (n * 1.5) + [0, 0, -0.008])
    return [(z, material(color, **ZIP)), (pull, material("#8E888C", tex=None, rough=0.35, metal=0.8))]


# ================================================================ pillow bodies
def stuffed(w, d, h, pw=2.0, a=0.6, edge=0.1, waist=0.035, e_horiz=0.24, wrinkles=1.0, ears=0.55):
    """Gối nhồi: phồng giữa, mỏng ra mép, cạnh hơi thắt, góc nhọn, nếp nhăn tỏa từ góc."""
    P = superquadric(w, d, h, 1.0, e_horiz)
    U = np.clip(P[..., 0] / (w / 2), -1, 1)
    V = np.clip(P[..., 1] / (d / 2), -1, 1)
    dome = (1 - np.abs(U) ** pw) ** a * (1 - np.abs(V) ** pw) ** a
    corner = (np.abs(U) * np.abs(V)) ** 6
    scale = (edge + (1 - edge) * dome) * (1 - ears * corner)
    wr = np.zeros_like(U)
    for sx in (-1, 1):
        for sy in (-1, 1):
            dx, dy = (U - sx) * w / 2, (V - sy) * d / 2
            r = np.hypot(dx, dy)
            th = np.arctan2(dy * sy, dx * sx)
            wr += np.exp(-r / 0.09) * np.sin(th * 9 + r * 40) * 0.5
    wr += 0.25 * np.sin(U * 7.0 + V * 3.0) * np.sin(V * 5.5 - U * 2.0) * dome
    P[..., 2] = P[..., 2] * scale + np.sign(P[..., 2]) * wrinkles * 0.004 * wr
    P[..., 0] *= 1 - waist * (1 - V ** 2)
    P[..., 1] *= 1 - waist * 1.3 * (1 - U ** 2)
    return grid_mesh(P), P[P.shape[0] // 2].copy()


def gusset(w, d, h, e_vert=0.4, e_horiz=0.2, puff=0.06, rim_at=0.82):
    """Gối có thành đứng: viền trên & dưới, đường giữa thành dùng cho khóa kéo."""
    P = superquadric(w, d, h, e_vert, e_horiz)
    U = np.clip(P[..., 0] / (w / 2), -1, 1)
    V = np.clip(P[..., 1] / (d / 2), -1, 1)
    P[..., 2] *= 1 + puff * (1 - U ** 2) * (1 - V ** 2)
    zs = P[:, 0, 2] / (h / 2)
    rims = [P[int(np.argmin(np.abs(zs - s * rim_at)))].copy() for s in (-1, 1)]
    return grid_mesh(P), rims, P[P.shape[0] // 2].copy()


def contour(w=0.60, d=0.40):
    """Gối công thái học: gờ sau cao (~11 cm), gờ trước thấp hơn (~10 cm), lõm giữa (~8 cm)."""
    P = superquadric(w, d, 0.11, 0.3, 0.2)
    top = P[..., 2] > 0
    yy = P[..., 1] / (d / 2)  # -1 trước … +1 sau
    prof = 0.082 + 0.018 * np.exp(-((yy + 0.55) / 0.28) ** 2) + 0.032 * np.exp(-((yy - 0.48) / 0.3) ** 2)
    P[..., 2] = np.where(top, P[..., 2] / 0.055 * (prof - 0.055), P[..., 2])
    zs = P[:, 0, 2] / 0.055
    rim = P[int(np.argmin(np.abs(zs + 0.8)))].copy()
    return grid_mesh(P), rim


def bolster(L, wid, hei, n_around=72, n_len=160):
    """Gối ôm dạng ống, hai đầu bo tròn và hơi chụm lại (đầu may rút)."""
    t = np.linspace(-1, 1, n_len)[:, None]
    phi = np.linspace(-np.pi, np.pi, n_around, endpoint=False)[None, :]
    cap = 0.13  # phần bo đầu theo tỉ lệ chiều dài
    s = np.where(np.abs(t) < 1 - cap, 1.0, np.sqrt(np.clip(1 - ((np.abs(t) - (1 - cap)) / cap) ** 2, 0, 1)))
    s = np.maximum(s, 1e-4) * (1 + 0.012 * np.sin(t * 30))  # gợn nhẹ dọc thân
    x = L / 2 * np.where(np.abs(t) < 1 - cap, t, np.sign(t) * ((1 - cap) + cap * np.sqrt(np.clip(1 - s ** 2, 0, 1)))) * np.ones_like(phi)
    y = wid / 2 * s * np.cos(phi)
    z = hei / 2 * s * np.sin(phi)
    P = np.stack([x, y, z], -1)
    seam = P[(np.abs(t[:, 0]) < 1 - cap * 0.5), n_around // 4 * 3]  # đường may dưới thân
    return grid_mesh(P), seam


def u_pillow(R, a, b, theta, taper=0.25, arm=0.0, nu=64, nt=260):
    """Gối chữ U: thân dày phía sau, thon dần về hai đầu; arm = đoạn thẳng kéo dài ở hai tay."""
    t = np.linspace(-1, 1, nt)[:, None]
    c = 0.14
    s = np.where(np.abs(t) < 1 - c, 1.0, np.sqrt(np.clip(1 - ((np.abs(t) - (1 - c)) / c) ** 2, 0, 1)))
    s = np.maximum(s, 1e-4)
    thick = 1 - taper * t ** 2  # dày ở lưng, mỏng ở tay
    ang = t * theta + np.pi / 2
    phi = np.linspace(-np.pi, np.pi, nu, endpoint=False)[None, :]
    ripple = 1 + 0.01 * np.sin(t * 36) * (s > 0.9)
    rr = R + a * s * thick * ripple * np.cos(phi)
    x = rr * np.cos(ang)
    y = -rr * np.sin(ang) + R * 0.35
    # kéo dài hai tay về phía trước
    y = y + arm * np.clip((np.abs(t) - 0.55) / 0.45, 0, 1) ** 1.5
    z = b * s * thick * ripple * np.sin(phi) * np.ones_like(ang) + 0.005 * t ** 2
    P = np.stack([x, y, z], -1)

    def seam(ph):
        j = int(np.argmin(np.abs(((phi[0] - ph + np.pi) % (2 * np.pi)) - np.pi)))
        return P[(s[:, 0] > 0.4), j]
    return grid_mesh(P), seam, P


# ================================================================ assembly & export
def planar_uv(mesh, scale):
    v, n = mesh.vertices, mesh.vertex_normals
    ax = np.argmax(np.abs(n), axis=1)[:, None]
    uv = np.where(ax == 2, v[:, [0, 1]], np.where(ax == 0, v[:, [1, 2]], v[:, [0, 2]]))
    return uv * scale


def part(mesh, color, tex="weave", **kw):
    return (mesh, material(color, tex=tex, **kw), UV.get(tex, 20.0))


def build(name, parts):
    scene = trimesh.Scene()
    for mesh, mat, uv_scale in parts:
        mesh = mesh.copy()
        mesh.visual = trimesh.visual.TextureVisuals(uv=planar_uv(mesh, uv_scale), material=mat)
        scene.add_geometry(mesh)
    lo = scene.bounds[0][2]
    T = trimesh.transformations.rotation_matrix(-np.pi / 2, [1, 0, 0]) @ \
        trimesh.transformations.translation_matrix([0, 0, -lo])
    scene.apply_transform(T)  # đáy chạm sàn, trục Y hướng lên (chuẩn glTF)
    path = os.path.join(OUT, f"{name}.glb")
    scene.export(path, include_normals=True)
    ext = scene.extents
    print(f"{name}: {ext[0]*100:.0f} x {ext[2]*100:.0f} x {ext[1]*100:.0f} cm  ({os.path.getsize(path)//1024} KB)")


def fix_zip(parts):
    """zipper() trả về (mesh, material); thêm tỉ lệ UV cho đồng bộ."""
    return [(m, mat, 20.0) for m, mat in parts]


# ================================================================ 12 sản phẩm
# Gối nhồi bông dựng ở độ phồng tự nhiên như ảnh sản phẩm (~2 lần chiều cao khi nằm trong bảng thông số).
WHITE = "#EEEBE8"

# N01 Mellow – gối trắng trơn, đường may mảnh, góc nhọn
body, rim = stuffed(0.70, 0.50, 0.20, pw=2.2, a=0.42, edge=0.26, ears=0.6)
build("n01", [part(body, WHITE), part(tube(rim, 0.0025), WHITE, mul=0.95)])

# N02 Balance – trắng, viền ống mảnh cùng màu
body, rim = stuffed(0.70, 0.50, 0.21, pw=2.4, a=0.4, edge=0.28)
build("n02", [part(body, "#ECEAE6"), part(tube(rim, 0.004), "#ECEAE6", mul=0.93, rough=0.85)])

# N03 Form Support – thành gusset, 2 viền trên/dưới, mặt trên phồng
body, rims, mid = gusset(0.70, 0.50, 0.12, e_vert=0.42, puff=0.16)
build("n03", [part(body, "#EDEBEE")] + [part(tube(r * [1.002, 1.002, 1], 0.0042), "#EDEBEE", mul=0.92, rough=0.85) for r in rims])

# N04 Low Profile – gối thấp, mặt trần bông hình thoi, viền mảnh
body, rims, mid = gusset(0.70, 0.50, 0.075, e_vert=0.55, e_horiz=0.2, puff=0.12, rim_at=0.75)
build("n04", [part(body, "#F0EEEC", tex="quilt")] + [part(tube(r * [1.002, 1.002, 1], 0.003), "#F0EEEC", mul=0.93) for r in rims])

# N05 Flex Adjustable – trắng, viền ống XÁM, khóa kéo dọc cạnh dài phía trước
body, rim = stuffed(0.70, 0.50, 0.21, pw=2.4, a=0.4, edge=0.28)
build("n05", [part(body, "#EEEDEB"), part(tube(rim, 0.0048), "#A3A2A6", rough=0.8)] +
      fix_zip(zipper(rim, side="-y", frac=0.8, out=0.006, color="#A3A2A6")))

# N06 Cloud Plush – rất phồng, viền ống trắng, phong cách khách sạn
body, rim = stuffed(0.70, 0.50, 0.24, pw=2.2, a=0.4, edge=0.26, waist=0.05)
build("n06", [part(body, "#F1EEEF"), part(tube(rim, 0.0048), "#F1EEEF", mul=0.93, rough=0.85)])

# N07 Signature Comfort – vỏ có viền vải phẳng (flange) quanh mép, thân phồng bao lõi latex
body, rim = stuffed(0.56, 0.36, 0.14, pw=2.2, a=0.45, edge=0.2, ears=0.2, wrinkles=0.6)
flange = grid_mesh(superquadric(0.60, 0.40, 0.007, 0.25, 0.16, nu=180, nv=31))
build("n07", [part(body, "#EFECE8"), part(flange, "#EFECE8", mul=0.97),
              part(tube(rim, 0.003), "#EFECE8", mul=0.9)])

# N08 Contour – dệt kim trắng, gờ sau cao hơn gờ trước, tem nhãn đen bên hông
body, rim = contour()
xmax = body.bounds[1][0]
label = box([0.004, 0.035, 0.012], [xmax + 0.001, -0.02, 0.0])
build("n08", [part(body, "#ECECEE", tex="knit"), part(tube(rim * [1.002, 1.002, 1], 0.0032), "#ECECEE", mul=0.9),
              part(label, "#2B2A2D", tex=None, rough=0.6)])

# N09 Hug – gối ôm dạng ống dài màu be, hai đầu bo tròn
body, seam = bolster(1.20, 0.24, 0.16)
build("n09", [part(body, "#E2D3BF"), part(tube(seam, 0.0025, closed=False, n=8), "#E2D3BF", mul=0.92)])

# N10 Rest – chữ U dáng lưỡi liềm: mặt trên trần bông trắng, đáy xám đậm
R, a, b = 0.092, 0.06, 0.055
body, seam, _ = u_pillow(R, a, b, theta=np.radians(150), taper=0.5)
k = np.arcsin(0.05)
top, bot = split_by(body, lambda c: c[:, 2] > b * 0.05)
build("n10", [part(top, "#F2F1EF", tex="quilt"), part(bot, "#5C5A5E", tex="knit"),
              part(tube(seam(k), 0.004, closed=False, n=10), "#5C5A5E", mul=0.9),
              part(tube(seam(np.pi - k), 0.004, closed=False, n=10), "#5C5A5E", mul=0.9)])

# N11 Move Travel – chữ U dẹt, tay dài: ngoài lưới xám đậm, trong nhung nâu nhạt, quai ở hai đầu
R, a, b = 0.078, 0.07, 0.046
body, seam, P = u_pillow(R, a, b, theta=np.radians(105), taper=0.15, arm=0.13)
cy = R * 0.35
inner_r = R + a * 0.25


def is_inner(c):
    return np.hypot(c[:, 0], c[:, 1] - cy) < inner_r + 0.0 * c[:, 2]


inn, out = split_by(body, is_inner)
k = np.arccos(0.25)
tabs = []
for end in (P[0].mean(0), P[-1].mean(0)):
    loop = trimesh.creation.torus(major_radius=0.012, minor_radius=0.003)
    loop.apply_transform(trimesh.transformations.rotation_matrix(np.pi / 2, [0, 1, 0]))
    loop.apply_translation(end + [0, -0.012, 0])
    tabs.append(part(loop, "#3A3739", tex=None, rough=0.7))
build("n11", [part(inn, "#BDB2A4", tex="velvet", rough=1.0), part(out, "#6F6A67", tex="mesh"),
              part(tube(seam(k), 0.0038, closed=False, n=10), "#5E5956"),
              part(tube(seam(-k), 0.0038, closed=False, n=10), "#5E5956")] + tabs)

# N12 Mini – khối chữ nhật: mặt trên/dưới nâu nhạt, thành xám đậm, 2 viền
body, rims, mid = gusset(0.30, 0.20, 0.075, e_vert=0.35, e_horiz=0.22, puff=0.08, rim_at=0.7)
hz = body.bounds[1][2]
face, band = split_by(body, lambda c: np.abs(c[:, 2]) > hz * 0.7)
build("n12", [part(face, "#B9A9A1", tex="velvet", rough=1.0), part(band, "#5F5D61", tex="knit")] +
      [part(tube(r * [1.003, 1.003, 1], 0.0032), "#4E4C50") for r in rims])


# ================================================================ baked shading (vertex colors)
def bake_shading(path, light=(-0.45, -0.75, 0.75), ambient=0.6):
    """Thêm COLOR_0 vào GLB: sáng tối nhẹ theo hướng ánh sáng + tối ở mặt dưới,
    giúp bề mặt vải trắng có khối khi xem 3D và AR."""
    import json
    import struct
    b = open(path, "rb").read()
    jl = struct.unpack("<I", b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    off = 20 + jl
    bl = struct.unpack("<I", b[off:off + 4])[0]
    binb = bytearray(b[off + 8:off + 8 + bl])
    L = np.array(light, float)
    L /= np.linalg.norm(L)

    def read(acc_i):
        acc = j["accessors"][acc_i]
        bv = j["bufferViews"][acc["bufferView"]]
        start = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
        n = acc["count"]
        return np.frombuffer(bytes(binb[start:start + n * 12]), dtype=np.float32).reshape(n, 3)

    for mesh in j["meshes"]:
        for prim in mesh["primitives"]:
            at = prim["attributes"]
            if "NORMAL" not in at or "COLOR_0" in at:
                continue
            nrm = read(at["NORMAL"])
            pos = read(at["POSITION"])
            lam = np.clip(nrm @ L, 0, 1) ** 0.8
            under = np.clip(-nrm[:, 2], 0, 1)  # mặt hướng xuống tối hơn
            zr = (pos[:, 2] - pos[:, 2].min()) / max(1e-6, np.ptp(pos[:, 2]))
            col = (ambient + (1 - ambient) * lam) * (1 - 0.18 * under) * (0.9 + 0.1 * zr)
            col = np.clip(col, 0, 1)
            rgba = np.repeat(col[:, None], 4, 1).astype(np.float32)
            rgba[:, 3] = 1.0
            while len(binb) % 4:
                binb.append(0)
            start = len(binb)
            binb.extend(rgba.tobytes())
            j["bufferViews"].append({"buffer": 0, "byteOffset": start, "byteLength": rgba.nbytes})
            j["accessors"].append({"bufferView": len(j["bufferViews"]) - 1, "componentType": 5126,
                                   "count": len(rgba), "type": "VEC4"})
            at["COLOR_0"] = len(j["accessors"]) - 1
    while len(binb) % 4:
        binb.append(0)
    j["buffers"][0]["byteLength"] = len(binb)
    js = json.dumps(j, separators=(",", ":")).encode()
    js += b" " * ((4 - len(js) % 4) % 4)
    total = 12 + 8 + len(js) + 8 + len(binb)
    out = struct.pack("<III", 0x46546C67, 2, total) + struct.pack("<II", len(js), 0x4E4F534A) + js + \
        struct.pack("<II", len(binb), 0x004E4942) + bytes(binb)
    open(path, "wb").write(out)


for _f in sorted(os.listdir(OUT)):
    if _f.endswith(".glb"):
        bake_shading(os.path.join(OUT, _f))
print("baked shading")
