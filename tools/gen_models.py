"""Tạo mô hình 3D (GLB) cho 12 mẫu gối NESTORA, đúng kích thước thật (đơn vị mét).

Chạy:  pip install trimesh numpy && python3 tools/gen_models.py
Kết quả: assets/models/n01.glb ... n12.glb
"""
import os
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "models")
os.makedirs(OUT, exist_ok=True)


def spow(x, e):
    return np.sign(x) * np.abs(x) ** e


def grid_mesh(P, closed_u=True):
    """P: (nv, nu, 3) lưới đỉnh; u quấn vòng, v từ cực này sang cực kia."""
    nv, nu, _ = P.shape
    verts = P.reshape(-1, 3)
    faces = []
    for i in range(nv - 1):
        for j in range(nu if closed_u else nu - 1):
            a = i * nu + j
            b = i * nu + (j + 1) % nu
            c = (i + 1) * nu + j
            d = (i + 1) * nu + (j + 1) % nu
            faces += [[a, c, b], [b, c, d]]
    m = trimesh.Trimesh(verts, np.array(faces), process=True)
    m.merge_vertices()
    m.update_faces(m.nondegenerate_faces())
    if m.volume < 0:  # đảm bảo pháp tuyến hướng ra ngoài
        m.invert()
    return m


def superquadric(w, d, h, e_vert, e_horiz, nu=128, nv=64):
    """Hộp bo tròn: e_vert nhỏ = thành gối đứng (gusset), ~1 = viền mỏng kiểu gối nhồi."""
    eta = np.linspace(-np.pi / 2, np.pi / 2, nv)[:, None]
    om = np.linspace(-np.pi, np.pi, nu, endpoint=False)[None, :]
    x = w / 2 * spow(np.cos(eta), e_vert) * spow(np.cos(om), e_horiz)
    y = d / 2 * spow(np.cos(eta), e_vert) * spow(np.sin(om), e_horiz)
    z = h / 2 * spow(np.sin(eta), e_vert) * np.ones_like(om)
    return np.stack([x, y, z], -1)


def pillow(w, d, h, e_vert=1.0, e_horiz=0.25, pinch=0.18):
    P = superquadric(w, d, h, e_vert, e_horiz)
    # gối nhồi: các góc xẹp hơn phần giữa
    r = np.maximum(np.abs(P[..., 0]) / (w / 2), np.abs(P[..., 1]) / (d / 2))
    P[..., 2] *= 1 - pinch * r ** 4
    return grid_mesh(P)


def stuffed(w, d, h, pw=2.2, a=0.55, pw_len=None, waist=0.035, edge=0.1, e_vert=1.0, e_horiz=0.24):
    """Gối nhồi bông: viền bo tròn, phồng cao ở giữa, cạnh hơi thắt vào như gối thật."""
    P = superquadric(w, d, h, e_vert, e_horiz, nu=144, nv=72)
    U = np.clip(P[..., 0] / (w / 2), -1, 1)
    V = np.clip(P[..., 1] / (d / 2), -1, 1)
    dome = (1 - np.abs(U) ** (pw_len or pw)) ** a * (1 - np.abs(V) ** pw) ** a
    corner = (np.abs(U) * np.abs(V)) ** 6  # 4 góc nhọn như tai gối
    P[..., 2] *= (edge + (1 - edge) * dome) * (1 - 0.5 * corner)
    P[..., 0] *= 1 - waist * (1 - V ** 2)
    P[..., 1] *= 1 - waist * 1.3 * (1 - U ** 2)
    return grid_mesh(P)


def contour(w=0.60, d=0.40, h_mid=0.08, h_side=0.112):
    P = superquadric(w, d, h_side, 0.28, 0.22)
    top = P[..., 2] > 0
    yy = P[..., 1] / (d / 2)  # -1..1 theo chiều sâu
    # hai gờ cao ở hai mép, lõm ở giữa (gờ trước cao hơn một chút)
    prof = h_mid + (h_side - h_mid) * (np.abs(yy) ** 1.6) * (1.0 + 0.12 * (yy > 0))
    P[..., 2] = np.where(top, P[..., 2] / (h_side / 2) * (prof - h_side / 2) + 0, P[..., 2])
    P[..., 2] = np.where(top, np.clip(P[..., 2], 0, None) + 0, P[..., 2])
    m = grid_mesh(P)
    m.apply_translation([0, 0, 0])
    return m


def u_pillow(R=0.10, a=0.055, b=0.05, theta=np.radians(150), nu=48, nt=200):
    """Gối chữ U: ống elip chạy theo cung tròn, hai đầu bo tròn."""
    t = np.linspace(-1, 1, nt)[:, None]
    c = 0.16
    s = np.where(np.abs(t) < 1 - c, 1.0, np.sqrt(np.clip(1 - ((np.abs(t) - (1 - c)) / c) ** 2, 0, 1)))
    s = np.maximum(s, 1e-4)
    ang = t * theta + np.pi / 2  # mở về phía trước (-y)
    phi = np.linspace(-np.pi, np.pi, nu, endpoint=False)[None, :]
    rr = R + a * s * np.cos(phi)
    x = rr * np.cos(ang)
    y = -rr * np.sin(ang) + R * 0.35
    z = b * s * np.sin(phi) * np.ones_like(ang)
    # đầu ống hơi cong lên tạo dáng ôm cổ
    z = z + 0.006 * (np.abs(t) ** 2)
    P = np.stack([x, y, z], -1)
    return grid_mesh(P)


def color(hexstr):
    h = hexstr.lstrip("#")
    # glTF dùng màu tuyến tính: đổi từ sRGB
    return [(int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4)] + [1.0]


def save(mesh, name, base, rough=0.92):
    # đặt đáy gối chạm mặt phẳng (z) rồi đổi sang trục Y hướng lên theo chuẩn glTF
    mesh.apply_translation([0, 0, -mesh.bounds[0][2]])
    mesh.apply_transform(trimesh.transformations.rotation_matrix(-np.pi / 2, [1, 0, 0]))
    mesh.visual = trimesh.visual.TextureVisuals(uv=np.zeros((len(mesh.vertices), 2)), material=PBRMaterial(
        baseColorFactor=color(base), roughnessFactor=rough, metallicFactor=0.0, doubleSided=False))
    path = os.path.join(OUT, f"{name}.glb")
    mesh.export(path, include_normals=True)
    ext = mesh.extents
    print(f"{name}: {ext[0]*100:.0f} x {ext[2]*100:.0f} x {ext[1]*100:.0f} cm  ({os.path.getsize(path)//1024} KB)")


WHITE = "#E6E1DD"
models = {
    "n01": (stuffed(0.70, 0.50, 0.10, 2.0, 1.25), WHITE),            # Mellow – mềm, bồng
    "n02": (stuffed(0.70, 0.50, 0.10, 2.2, 1.0), "#DCDAD5"),       # Balance
    "n03": (pillow(0.70, 0.50, 0.12, 0.45, 0.20, 0.06), "#DCD8DC"),       # Form Support – gusset
    "n04": (stuffed(0.70, 0.50, 0.07, 2.5, 0.7, edge=0.3), WHITE),             # Low Profile
    "n05": (stuffed(0.70, 0.50, 0.11, 2.2, 1.0), "#D5DCD8"),        # Flex Adjustable
    "n06": (stuffed(0.70, 0.50, 0.12, 2.0, 1.0, waist=0.05), "#E8E3E5"),        # Cloud Plush – phồng cao
    "n07": (pillow(0.60, 0.40, 0.10, 0.35, 0.18, 0.0), "#DDD5CE"),        # Signature – latex khối
    "n08": (contour(), "#D9DADD"),                                         # Contour
    "n09": (stuffed(1.20, 0.35, 0.14, 2.0, 0.5, pw_len=8, waist=0.0, edge=0.7, e_vert=0.9, e_horiz=0.45), "#D9C7B0"),       # Hug – gối ôm dài
    "n10": (u_pillow(R=0.095, a=0.052, b=0.048), "#D8D8D5"),               # Rest – chữ U văn phòng
    "n11": (u_pillow(R=0.10, a=0.055, b=0.052), "#9C9089"),                # Move Travel
    "n12": (pillow(0.30, 0.20, 0.075, 0.6, 0.3, 0.08), "#B7A79F"),        # Mini
}

for name, (mesh, base) in models.items():
    save(mesh, name, base)
