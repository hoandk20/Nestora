/* NESTORA – kết nối Firebase (Authentication + Firestore), không cần server riêng.
   Nếu Firebase không tải được (mất mạng, bị chặn), Backend.available = false
   và web vẫn chạy bằng dữ liệu lưu trong trình duyệt. */
(function () {
  "use strict";

  const listeners = new Set();
  const Backend = {
    available: false,
    user: null, // { uid, email, name, provider }
    authReady: false,
    onAuth(fn) { listeners.add(fn); if (this.authReady) fn(this.user); return () => listeners.delete(fn); },
  };
  window.Backend = Backend;

  const ERR = {
    "auth/email-already-in-use": "Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.",
    "auth/invalid-email": "Email không hợp lệ.",
    "auth/weak-password": "Mật khẩu cần ít nhất 6 ký tự.",
    "auth/missing-password": "Vui lòng nhập mật khẩu.",
    "auth/invalid-credential": "Email hoặc mật khẩu không đúng.",
    "auth/invalid-login-credentials": "Email hoặc mật khẩu không đúng.",
    "auth/wrong-password": "Email hoặc mật khẩu không đúng.",
    "auth/user-not-found": "Không tìm thấy tài khoản với email này.",
    "auth/too-many-requests": "Bạn thử quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.",
    "auth/network-request-failed": "Không kết nối được máy chủ. Kiểm tra mạng và thử lại.",
    "auth/popup-closed-by-user": "Bạn đã đóng cửa sổ đăng nhập Google.",
    "auth/popup-blocked": "Trình duyệt đã chặn cửa sổ đăng nhập. Hãy cho phép cửa sổ bật lên và thử lại.",
    "auth/operation-not-allowed": "Hình thức đăng nhập này chưa được bật trong Firebase.",
    "auth/unauthorized-domain": "Tên miền này chưa được cho phép trong Firebase (Authentication → Settings → Authorized domains).",
    "permission-denied": "Bạn không có quyền thực hiện thao tác này.",
    unavailable: "Không kết nối được máy chủ. Vui lòng thử lại.",
  };
  Backend.message = (e) => ERR[e && e.code] || (e && e.message) || "Đã có lỗi xảy ra. Vui lòng thử lại.";

  if (!window.firebase || !window.NESTORA_FIREBASE) {
    Backend.authReady = true;
    return;
  }

  let auth, db, FieldValue;
  try {
    const app = firebase.initializeApp(window.NESTORA_FIREBASE);
    auth = app.auth();
    db = app.firestore();
    FieldValue = firebase.firestore.FieldValue;
    auth.languageCode = "vi";
    Backend.available = true;
  } catch (e) {
    console.warn("Firebase init failed", e);
    Backend.authReady = true;
    return;
  }

  const toUser = (u) => u && {
    uid: u.uid, email: u.email, name: u.displayName || "",
    provider: (u.providerData[0] && u.providerData[0].providerId) || "password",
  };

  auth.onAuthStateChanged((u) => {
    Backend.user = toUser(u);
    Backend.authReady = true;
    listeners.forEach((fn) => { try { fn(Backend.user); } catch (e) { console.error(e); } });
  });

  const need = () => { if (!auth.currentUser) throw { code: "auth/requires-login", message: "Vui lòng đăng nhập." }; return auth.currentUser; };
  const clean = (o) => JSON.parse(JSON.stringify(o)); // bỏ undefined, chuẩn hóa dữ liệu

  /* ---------- Tài khoản ---------- */
  Backend.signUp = async ({ name, email, password }) => {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    if (name) await cred.user.updateProfile({ displayName: name });
    await db.collection("users").doc(cred.user.uid).set({
      name: name || "", email, createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    Backend.user = toUser(auth.currentUser);
    listeners.forEach((fn) => fn(Backend.user));
    return Backend.user;
  };
  Backend.signIn = (email, password) => auth.signInWithEmailAndPassword(email, password).then((c) => toUser(c.user));
  Backend.signInGoogle = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    const cred = await auth.signInWithPopup(provider);
    const ref = db.collection("users").doc(cred.user.uid);
    const snap = await ref.get();
    if (!snap.exists) await ref.set({ name: cred.user.displayName || "", email: cred.user.email, createdAt: FieldValue.serverTimestamp() });
    return toUser(cred.user);
  };
  Backend.signOut = () => auth.signOut();
  Backend.resetPassword = (email) => auth.sendPasswordResetEmail(email);

  Backend.getProfile = async () => {
    const u = need();
    const snap = await db.collection("users").doc(u.uid).get();
    return snap.exists ? snap.data() : {};
  };
  Backend.saveProfile = async (data) => {
    const u = need();
    await db.collection("users").doc(u.uid).set({ ...clean(data), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    if (data.name && data.name !== u.displayName) await u.updateProfile({ displayName: data.name });
  };

  /* ---------- Đơn hàng ---------- */
  Backend.saveOrder = async (order) => {
    const u = auth.currentUser;
    await db.collection("orders").doc(order.id).set({
      ...clean(order), uid: u ? u.uid : null, email: (u && u.email) || order.customer.email || "",
      createdAt: FieldValue.serverTimestamp(),
    });
  };
  Backend.myOrders = async () => {
    const u = need();
    const qs = await db.collection("orders").where("uid", "==", u.uid).get();
    return qs.docs.map((d) => d.data()).sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
  };
  Backend.getOrder = async (id) => {
    const snap = await db.collection("orders").doc(id).get();
    return snap.exists ? snap.data() : null;
  };

  /* ---------- Pillow Quiz & Liên hệ ---------- */
  Backend.saveQuiz = async (result) => {
    const u = need();
    await db.collection("users").doc(u.uid).collection("quiz").add({ ...clean(result), createdAt: FieldValue.serverTimestamp() });
  };
  Backend.myQuiz = async () => {
    const u = need();
    const qs = await db.collection("users").doc(u.uid).collection("quiz").orderBy("createdAt", "desc").limit(10).get();
    return qs.docs.map((d) => d.data());
  };
  Backend.saveContact = async (msg) => {
    const u = auth.currentUser;
    await db.collection("contacts").add({ ...clean(msg), uid: u ? u.uid : null, createdAt: FieldValue.serverTimestamp() });
  };
})();
