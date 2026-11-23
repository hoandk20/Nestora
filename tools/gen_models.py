"""Tạo mô hình 3D (GLB) chi tiết cho 12 mẫu gối NESTORA, đúng kích thước thật (đơn vị mét).

Chi tiết: vân vải (normal map), nếp nhăn ở góc, đường viền ống (piping), khóa kéo,
khóa cài gối chữ U, phối màu hai mặt.

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


# ---------------------------------------------------------------- textures
def normal_from_height(h, strength):
    gy, gx = np.gradient(h)
    n = np.stack([-gx * strength, -gy * strength, np.ones_like(h)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return Image.fromarray(((n * 0.5 + 0.5) * 255).astype(np.uint8), "RGB")


def tileable_noise(size, cells, seed):
    r = np.random.default_rng(seed)
    g = r.random((cells, cells))
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


def fabric_texture(kind, size=256, threads=16):
    y, x = np.mgrid[0:size, 0:size] / size * threads
    if kind == "weave":  # vải cotton dệt
        over = ((np.floor(x) + np.floor(y)) % 2).astype(float)
        h = over * np.sin(np.pi * (x % 1)) ** 0.6 + (1 - over) * np.sin(np.pi * (y % 1)) ** 0.6
        strength = 2.2
    elif kind == "knit":  # vải dệt kim: các vòng chữ V
        h = np.abs(np.sin(np.pi * (x + 0.5 * np.abs(np.sin(np.pi * y))))) * np.sin(np.pi * (y % 1)) ** 0.5
        strength = 2.8
    else:  # vải lưới lỗ tròn
        cx, cy = (x % 1) - 0.5, (y % 1) - 0.5
        h = np.clip(np.sqrt(cx ** 2 + cy ** 2) * 3 - 0.6, 0, 1)
        strength = 4.0
    h = h + 0.35 * tileable_noise(size, 8, threads) + 0.15 * tileable_noise(size, 32, threads + 1)
    return normal_from_height(h, strength)


TEX = {k: fabric_texture(k) for k in ("weave", "knit", "mesh")}


def srgb_lin(hexstr, mul=1.0):
    h = hexstr.lstrip("#")
    return [min(1.0, int(h[i:i + 2], 16) / 255 * mul) ** 2.2 for i in (0, 2, 4)] + [1.0]


def material(hexstr, tex="weave", rough=0.95, metal=0.0, mul=1.0):
    m = PBRMaterial(baseColorFactor=srgb_lin(hexstr, mul), roughnessFactor=rough, metallicFactor=metal)
    if tex:
        m.normalTexture = TEX[tex]
    return m


METAL = dict(tex=None, rough=0.45, metal=0.6)


# ---------------------------------------------------------------- geometry helpers
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
    """Ống tròn chạy theo đường cong (đường viền, khóa kéo...)."""
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
    if not closed:  # bịt hai đầu
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


# ---------------------------------------------------------------- pillow bodies
def stuffed(w, d, h, pw=2.0, a=1.0, pw_len=None, waist=0.035, edge=0.12, e_horiz=0.24, wrinkles=1.0):
    """Gối nhồi: phồng giữa, mỏng ra mép, cạnh thắt, góc nhọn, nếp nhăn tỏa từ góc."""
    P = superquadric(w, d, h, 1.0, e_horiz)
    U = np.clip(P[..., 0] / (w / 2), -1, 1)
    V = np.clip(P[..., 1] / (d / 2), -1, 1)
    dome = (1 - np.abs(U) ** (pw_len or pw)) ** a * (1 - np.abs(V) ** pw) ** a
    corner = (np.abs(U) * np.abs(V)) ** 6
    scale = (edge + (1 - edge) * dome) * (1 - 0.55 * corner)
    wr = np.zeros_like(U)
    for sx in (-1, 1):
        for sy in (-1, 1):
            dx, dy = (U - sx) * w / 2, (V - sy) * d / 2
            r = np.sqrt(dx ** 2 + dy ** 2)
            th = np.arctan2(dy * sy, dx * sx)
            wr += np.exp(-r / 0.09) * np.sin(th * 9 + r * 40) * 0.5
    wr += 0.25 * np.sin(U * 7.0 + V * 3.0) * np.sin(V * 5.5 - U * 2.0) * dome
    sgn = np.sign(P[..., 2])
    P[..., 2] = P[..., 2] * scale + sgn * wrinkles * 0.004 * wr
    P[..., 0] *= 1 - waist * (1 - V ** 2)
    P[..., 1] *= 1 - waist * 1.3 * (1 - U ** 2)
    rim = P[P.shape[0] // 2].copy()  # đường may quanh mép (z = 0)
    return grid_mesh(P), rim


def gusset(w, d, h, e_vert=0.4, e_horiz=0.2, puff=0.06):
    """Gối có thành đứng: viền trên & dưới, khóa kéo ở giữa thành."""
    P = superquadric(w, d, h, e_vert, e_horiz)
    U = np.clip(P[..., 0] / (w / 2), -1, 1)
    V = np.clip(P[..., 1] / (d / 2), -1, 1)
    P[..., 2] *= 1 + puff * (1 - U ** 2) * (1 - V ** 2)
    zs = P[:, 0, 2] / (h / 2)
    rims = [P[int(np.argmin(np.abs(zs - s * 0.82)))].copy() for s in (-1, 1)]
    mid = P[P.shape[0] // 2].copy()
    return grid_mesh(P), rims, mid


def contour(w=0.60, d=0.40, h_mid=0.08, h_side=0.112):
    P = superquadric(w, d, h_side, 0.28, 0.22)
    top = P[..., 2] > 0
    yy = P[..., 1] / (d / 2)
    prof = h_mid + (h_side - h_mid) * (np.abs(yy) ** 1.6) * (1.0 + 0.12 * (yy > 0))
    P[..., 2] = np.where(top, P[..., 2] / (h_side / 2) * (prof - h_side / 2), P[..., 2])
    zs = P[:, 0, 2] / (h_side / 2)
    rim = P[int(np.argmin(np.abs(zs + 0.8)))].copy()
    mid = P[int(np.argmin(np.abs(zs + 0.2)))].copy()
    return grid_mesh(P), rim, mid


def u_pillow(R, a, b, theta=np.radians(150), nu=64, nt=240):
    t = np.linspace(-1, 1, nt)[:, None]
    c = 0.16
    s = np.where(np.abs(t) < 1 - c, 1.0, np.sqrt(np.clip(1 - ((np.abs(t) - (1 - c)) / c) ** 2, 0, 1)))
    s = np.maximum(s, 1e-4)
    ang = t * theta + np.pi / 2
    phi = np.linspace(-np.pi, np.pi, nu, endpoint=False)[None, :]
    ripple = 1 + 0.012 * np.sin(t * 38) * (s > 0.9)  # gợn vải co giãn dọc thân
    rr = R + a * s * ripple * np.cos(phi)
    x = rr * np.cos(ang)
    y = -rr * np.sin(ang) + R * 0.35
    z = b * s * ripple * np.sin(phi) * np.ones_like(ang) + 0.006 * (np.abs(t) ** 2)
    P = np.stack([x, y, z], -1)
    ends = [P[0].mean(0), P[-1].mean(0)]

    def seam(ph):  # đường may chạy dọc thân tại góc phi = ph
        j = int(np.argmin(np.abs(((phi[0] - ph + np.pi) % (2 * np.pi)) - np.pi)))
        return P[(s[:, 0] > 0.35), j]
    return grid_mesh(P), ends, seam


# ---------------------------------------------------------------- assembly & export
def planar_uv(mesh, scale):
    v, n = mesh.vertices, mesh.vertex_normals
    ax = np.argmax(np.abs(n), axis=1)[:, None]
    uv = np.where(ax == 2, v[:, [0, 1]], np.where(ax == 0, v[:, [1, 2]], v[:, [0, 2]]))
    return uv * scale


def build(name, parts):
    scene = trimesh.Scene()
    for item in parts:
        mesh, mat = item[0].copy(), item[1]
        uv_scale = item[2] if len(item) > 2 else 28.0
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


def zipper(rim, frac=0.62, out=0.003):
    """Khóa kéo dọc cạnh ngắn (+x) của đường may + đầu kéo."""
    pts = rim[rim[:, 0] > rim[:, 0].max() * 0.9]
    pts = pts[np.argsort(pts[:, 1])]
    lim = (pts[:, 1].max() - pts[:, 1].min()) * frac / 2
    pts = pts[np.abs(pts[:, 1]) < lim] + [out, 0, 0]
    z = tube(pts, 0.0045, closed=False, n=8, flat=0.45)
    pull = box([0.004, 0.022, 0.007], pts[-1] + [0.004, 0.008, 0])
    return [(z, material("#9C979B", **METAL)), (pull, material("#8E888C", tex=None, rough=0.35, metal=0.8))]


def stuffed_pillow(name, color, w, d, h, zip_=True, **kw):
    body, rim = stuffed(w, d, h, **kw)
    parts = [(body, material(color)), (tube(rim, 0.0045), material(color, mul=0.93, rough=0.85))]
    if zip_:
        parts += zipper(rim)
    build(name, parts)


def gusset_pillow(name, color, w, d, h, zip_=True, tex="weave", **kw):
    body, rims, mid = gusset(w, d, h, **kw)
    parts = [(body, material(color, tex=tex))]
    parts += [(tube(r * [1.002, 1.002, 1], 0.004), material(color, mul=0.92, rough=0.85)) for r in rims]
    if zip_:
        parts += zipper(mid, out=0.002)
    build(name, parts)


def u_shape(name, outer, inner, R, a, b, mesh_top=False):
    body, (e0, e1), seam = u_pillow(R, a, b)
    cy = R * 0.35
    if mesh_top:  # Rest: mặt trên vải lưới thoáng khí, mặt dưới dệt kim xám
        k = np.arcsin(0.15)
        top, bot = split_by(body, lambda c: c[:, 2] > b * 0.15 + 0.006 * 0)
        parts = [(top, material(inner, tex="mesh"), 22.0), (bot, material(outer, tex="knit"))]
        seams = [seam(k), seam(np.pi - k)]
    else:  # Move Travel: mặt trong ôm cổ sáng màu, mặt ngoài đậm
        k = np.arccos(0.15)
        inn, out = split_by(body, lambda c: np.hypot(c[:, 0], c[:, 1] - cy) < R + a * 0.15)
        parts = [(inn, material(inner)), (out, material(outer))]
        seams = [seam(k), seam(-k)]
    parts += [(tube(sm, 0.0042, closed=False, n=10), material(outer, mul=0.85, rough=0.8)) for sm in seams]
    # khóa cài phía trước: dây đai nối hai đầu + khóa nhựa
    mid = (e0 + e1) / 2
    span = np.linalg.norm(e1 - e0)
    ang = np.arctan2(e1[1] - e0[1], e1[0] - e0[0])
    parts += [(box([span * 1.05, 0.018, 0.004], mid + [0, 0, b * 0.35], ang), material(outer, mul=0.8, rough=0.8)),
              (box([0.03, 0.024, 0.01], mid + [0, 0, b * 0.35], ang), material("#2E2A30", tex=None, rough=0.4))]
    build(name, parts)


# Gối nhồi bông được dựng ở độ phồng tự nhiên (~1,5 lần chiều cao khi nằm trong bảng thông số).
WHITE = "#E9E4E0"
stuffed_pillow("n01", WHITE, 0.70, 0.50, 0.15, pw=2.0, a=0.6, edge=0.1)                          # Mellow
stuffed_pillow("n02", "#E2DFDA", 0.70, 0.50, 0.15, pw=2.2, a=0.55, edge=0.1, zip_=False)          # Balance
gusset_pillow("n03", "#E3DEE3", 0.70, 0.50, 0.12, e_vert=0.42, zip_=False)             # Form Support
stuffed_pillow("n04", WHITE, 0.70, 0.50, 0.10, pw=2.5, a=0.6, edge=0.15, zip_=False)   # Low Profile
stuffed_pillow("n05", "#DCE3DF", 0.70, 0.50, 0.16, pw=2.2, a=0.55, edge=0.1)                      # Flex Adjustable
stuffed_pillow("n06", "#ECE7E9", 0.70, 0.50, 0.18, pw=2.0, a=0.5, edge=0.1, waist=0.05, zip_=False)  # Cloud Plush
gusset_pillow("n07", "#E4DCD5", 0.60, 0.40, 0.10, e_vert=0.32, e_horiz=0.18, puff=0.02)   # Signature

body, rim, mid = contour()                                                               # Contour
build("n08", [(body, material("#DEDFE2", tex="knit")),
              (tube(rim * [1.002, 1.002, 1], 0.0035), material("#DEDFE2", mul=0.9))] + zipper(mid, out=0.002))

stuffed_pillow("n09", "#D9C7B0", 1.20, 0.35, 0.16, pw=2.0, a=0.5, pw_len=8, waist=0.0,
               edge=0.7, e_horiz=0.45, wrinkles=0.4, zip_=False)                         # Hug
u_shape("n10", "#5F5B5E", "#E4E4E1", R=0.095, a=0.052, b=0.048, mesh_top=True)           # Rest
u_shape("n11", "#8F847D", "#CDBFB3", R=0.10, a=0.055, b=0.052)                            # Move Travel
gusset_pillow("n12", "#B7A79F", 0.30, 0.20, 0.075, e_vert=0.6, e_horiz=0.3, puff=0.1, zip_=False)  # Mini
