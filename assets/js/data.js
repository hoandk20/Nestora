/* NESTORA – dữ liệu demo (không có server) */

const FILTER_LABELS = {
  collection: { sleep: "Sleep Collection", move: "Move Collection" },
  shape: {
    rect: "Chữ nhật",
    contour: "Công thái học",
    long: "Gối ôm dài",
    u: "Chữ U",
    mini: "Chữ nhật mini",
  },
  material: {
    microfiber: "Microfiber",
    hollow: "Sợi rỗng liên hợp",
    memory: "Memory Foam",
    latex: "Latex thiên nhiên",
  },
  feel: {
    verysoft: "Rất mềm",
    soft: "Mềm vừa",
    balanced: "Cân bằng",
    firm: "Khá chắc",
    flex: "Linh hoạt",
  },
  height: { low: "Thấp", medium: "Trung bình", high: "Cao", flex: "Tùy chỉnh" },
  fullness: { low: "Ít phồng", medium: "Vừa phải", full: "Đầy đặn", high: "Phồng cao" },
};

const PRODUCTS = [
  {
    id: "n01", code: "N01", name: "Mellow", price: 149000, collection: "sleep",
    category: "Gối ngủ", img: "assets/img/products/n01.jpg", tone: "#EADCD6",
    tagline: "Mềm mại, nhẹ nhàng và bồng bềnh",
    description:
      "Mellow được phát triển dành cho những người yêu thích cảm giác mềm mại, nhẹ nhàng và êm ái khi nghỉ ngơi. Cấu trúc bên trong sử dụng sợi Microfiber Polyester siêu mảnh, tạo độ phồng tự nhiên và cảm giác êm mềm. Thiết kế ưu tiên sự nhẹ nhàng, hạn chế cảm giác quá chắc hoặc nặng đầu.",
    specs: [
      ["Kích thước", "50 × 70 cm"], ["Chiều cao", "8–10 cm"],
      ["Cấu trúc bên trong", "Microfiber Polyester dạng cụm"], ["Chất liệu bề mặt", "Cotton pha Polyester"],
      ["Độ mềm", "Rất mềm"], ["Độ đầy đặn", "Vừa phải"], ["Tư thế tham khảo", "Nằm ngửa, người thích sản phẩm mềm"],
    ],
    highlights: [
      "Sợi microfiber mảnh, nhẹ và êm.", "Cảm giác mềm mại, bồng bềnh.",
      "Thiết kế dễ phối hợp với nhiều không gian phòng ngủ.", "Vỏ gối có khóa kéo giúp tháo rời và vệ sinh.",
    ],
    reason: "Phù hợp với người yêu thích một chiếc gối nhẹ nhàng, mềm mại và không có cảm giác nâng đỡ quá chắc chắn.",
    shape: "rect", material: "microfiber", fill: "Microfiber Polyester dạng cụm",
    feel: ["verysoft"], height: ["medium"], fullness: ["medium"],
    positions: ["back"], purposes: ["home"], quality: ["soft", "clean"],
  },
  {
    id: "n02", code: "N02", name: "Balance", price: 249000, collection: "sleep",
    category: "Gối ngủ", img: "assets/img/products/n02.jpg", tone: "#E4E7E3",
    tagline: "Cân bằng giữa độ êm và độ chắc chắn",
    description:
      "Balance mang đến sự kết hợp cân đối giữa độ mềm mại và khả năng nâng đỡ. Phần ruột sử dụng bông xơ Polyester rỗng liên hợp phủ silicon, có cấu trúc nhẹ và độ đàn hồi tốt. Khi được phân bố với mật độ phù hợp, ruột gối giúp duy trì độ đầy đặn và hỗ trợ phục hồi hình dáng sau khi sử dụng.",
    specs: [
      ["Kích thước", "50 × 70 cm"], ["Chiều cao", "8–10 cm"], ["Ruột gối", "Siliconized Hollow Conjugated Fiber"],
      ["Vỏ gối", "100% Cotton"], ["Độ mềm", "Trung bình"], ["Độ đầy đặn", "Vừa phải"], ["Tư thế tham khảo", "Nằm ngửa, thay đổi tư thế"],
    ],
    highlights: [
      "Sợi polyester rỗng liên hợp giúp tăng độ đàn hồi.", "Cân bằng giữa độ êm và độ chắc chắn.",
      "Duy trì độ phồng tốt khi được chăm sóc đúng cách.", "Vỏ cotton mềm, phù hợp sử dụng thường xuyên.",
    ],
    reason: "Lựa chọn cân đối dành cho người muốn một chiếc gối có độ mềm vừa phải, không quá lún cũng không quá cứng.",
    shape: "rect", material: "hollow", fill: "Siliconized Hollow Conjugated Fiber",
    feel: ["balanced"], height: ["medium"], fullness: ["medium"],
    positions: ["back", "mixed"], purposes: ["home"], quality: ["elastic", "shape", "soft"],
  },
  {
    id: "n03", code: "N03", name: "Form Support", price: 329000, collection: "sleep",
    category: "Gối ngủ", img: "assets/img/products/n03.jpg", tone: "#E9E2EC",
    tagline: "Chắc chắn, cấu trúc rõ ràng",
    description:
      "Form Support hướng đến người dùng yêu thích cảm giác chắc chắn và một chiếc gối có cấu trúc rõ ràng. Ruột gối sử dụng sự kết hợp giữa mảnh Memory Foam cắt nhỏ và sợi Polyester đàn hồi, tạo nên bề mặt có độ êm nhất định nhưng vẫn duy trì cảm giác nâng đỡ. Thiết kế thành gối có phần viền gusset giúp định hình sản phẩm và tạo độ đầy đặn đồng đều hơn.",
    specs: [
      ["Kích thước", "50 × 70 cm"], ["Chiều cao", "10–12 cm"], ["Ruột gối", "Shredded Memory Foam + Polyester Fiber"],
      ["Vỏ gối", "Cotton pha vải dệt kim co giãn"], ["Độ mềm", "Khá chắc"], ["Độ đầy đặn", "Đầy đặn"], ["Tư thế tham khảo", "Nằm nghiêng, người thích gối chắc"],
    ],
    highlights: [
      "Kết hợp foam cắt nhỏ với sợi polyester đàn hồi.", "Cấu trúc gusset hỗ trợ giữ hình dáng.",
      "Độ đầy đặn và cảm giác nâng đỡ rõ rệt.", "Phù hợp với người không thích gối quá mềm, dễ lún.",
    ],
    reason: "Dành cho khách hàng ưu tiên độ ổn định, cảm giác chắc chắn và muốn chiếc gối duy trì hình dáng rõ ràng.",
    shape: "rect", material: "memory", fill: "Shredded Memory Foam + Polyester Fiber",
    feel: ["firm"], height: ["high"], fullness: ["full"],
    positions: ["side"], purposes: ["home"], quality: ["shape", "elastic"],
  },
  {
    id: "n04", code: "N04", name: "Low Profile", price: 179000, collection: "sleep",
    category: "Gối ngủ", img: "assets/img/products/n04.jpg", tone: "#ECE8E4",
    tagline: "Độ cao thấp, gọn và nhẹ",
    description:
      "Low Profile được thiết kế dành cho những người yêu thích gối có độ cao thấp, hình dáng gọn và cảm giác nâng đỡ nhẹ. Phần ruột sử dụng sợi Polyester Microfiber có mật độ nhồi được kiểm soát, tạo bề mặt mềm mại nhưng hạn chế độ phồng quá mức.",
    specs: [
      ["Kích thước", "50 × 70 cm"], ["Chiều cao", "6–8 cm"], ["Ruột gối", "Fine Microfiber Polyester"],
      ["Vỏ gối", "Cotton pha Polyester"], ["Độ mềm", "Mềm vừa"], ["Độ đầy đặn", "Ít phồng"], ["Tư thế tham khảo", "Nằm sấp, người thích gối thấp"],
    ],
    highlights: [
      "Thiết kế độ cao thấp, gọn nhẹ.", "Mật độ nhồi được điều chỉnh để giảm độ phồng.",
      "Bề mặt mềm, không tạo cảm giác quá đầy đặn.", "Thích hợp cho người không quen sử dụng gối cao.",
    ],
    reason: "Dành cho người có sở thích sử dụng gối thấp và không muốn phần đầu bị nâng quá cao. Người nằm sấp nên ưu tiên gối rất mỏng; trong một số trường hợp có thể không cần gối đầu.",
    shape: "rect", material: "microfiber", fill: "Fine Microfiber Polyester",
    feel: ["soft"], height: ["low"], fullness: ["low"],
    positions: ["stomach"], purposes: ["home"], quality: ["soft"],
  },
  {
    id: "n05", code: "N05", name: "Flex Adjustable", price: 449000, collection: "sleep",
    category: "Gối ngủ", img: "assets/img/products/n05.jpg", tone: "#E2E6E4", badge: "Tùy chỉnh",
    tagline: "Tự điều chỉnh độ cao và độ phồng",
    description:
      "Flex Adjustable là dòng gối nổi bật với khả năng cá nhân hóa độ cao và độ đầy đặn. Sản phẩm được thiết kế với khóa kéo ở lớp vỏ và khoang ruột riêng, cho phép khách hàng chủ động thêm hoặc lấy bớt lượng bông bên trong. Nhờ đó, người dùng có thể điều chỉnh cảm giác sử dụng theo sở thích và nhu cầu của mình thay vì phải lựa chọn một mức nhồi cố định.",
    specs: [
      ["Kích thước", "50 × 70 cm"], ["Chiều cao mục tiêu", "Điều chỉnh khoảng 7–12 cm"], ["Ruột gối", "Siliconized Microfiber Cluster"],
      ["Vỏ gối", "100% Cotton"], ["Độ mềm", "Linh hoạt"], ["Độ đầy đặn", "Tùy chỉnh"], ["Tính năng", "Thêm/bớt ruột gối"],
    ],
    highlights: [
      "Khoang ruột có khóa kéo riêng.", "Chủ động điều chỉnh lượng bông.",
      "Có thể thay đổi độ phồng và cảm giác nâng đỡ.", "Thiết kế hướng đến nhu cầu cá nhân hóa.",
    ],
    reason: "Phù hợp với người chưa xác định được chiều cao và độ đầy đặn mong muốn, hoặc thường xuyên muốn thay đổi cảm giác sử dụng.",
    shape: "rect", material: "microfiber", fill: "Siliconized Microfiber Cluster",
    feel: ["flex", "soft", "balanced"], height: ["flex", "low", "medium", "high"], fullness: ["medium", "full"],
    positions: ["mixed", "side", "back"], purposes: ["home", "multi"], quality: ["soft", "shape", "clean"],
  },
  {
    id: "n06", code: "N06", name: "Cloud Plush", price: 399000, collection: "sleep",
    category: "Gối ngủ", img: "assets/img/products/n06.jpg", tone: "#EFE9EE", badge: "Bán chạy",
    tagline: "Bồng bềnh như một lớp mây",
    description:
      "Cloud Plush được phát triển dành cho những người yêu thích cảm giác bồng bềnh, mềm mại và đầy đặn. Ruột gối sử dụng Microgel Polyester Fiber dạng cụm, được phân bố với mật độ nhồi cao nhằm tạo độ phồng nổi bật. Cấu trúc sợi mảnh giúp bề mặt gối có cảm giác êm nhẹ và mềm mại khi tiếp xúc.",
    specs: [
      ["Kích thước", "50 × 70 cm"], ["Chiều cao", "10–12 cm"], ["Ruột gối", "Microgel Polyester Cluster"],
      ["Vỏ gối", "Cotton cao cấp"], ["Độ mềm", "Rất mềm"], ["Độ đầy đặn", "Phồng cao"],
      ["Tư thế tham khảo", "Người thích gối phồng, nằm ngửa hoặc nghiêng tùy độ lún"],
    ],
    highlights: [
      "Ruột gối microfiber dạng cụm tạo độ bồng bềnh.", "Mật độ nhồi cao hơn dòng Mellow.",
      "Bề mặt mềm mại và có độ phồng nổi bật.", "Phù hợp với không gian phòng ngủ theo phong cách khách sạn.",
    ],
    reason: "Dành cho người yêu thích trải nghiệm mềm mại, đầy đặn và cảm giác như đang nằm trên một lớp mây êm ái.",
    shape: "rect", material: "microfiber", fill: "Microgel Polyester Cluster",
    feel: ["verysoft"], height: ["high"], fullness: ["full", "high"],
    positions: ["back", "side"], purposes: ["home"], quality: ["soft", "shape"],
  },
  {
    id: "n07", code: "N07", name: "Signature Comfort", price: 590000, collection: "sleep",
    category: "Gối ngủ", img: "assets/img/products/n07.jpg", tone: "#E7DFDA", badge: "Cao cấp",
    tagline: "Lõi latex thiên nhiên, đàn hồi bền bỉ",
    description:
      "Signature Comfort là dòng sản phẩm cao cấp của NESTORA, tập trung vào chất liệu ruột gối và trải nghiệm nâng đỡ. Sản phẩm sử dụng lõi cao su thiên nhiên có cấu trúc lỗ thông khí, tạo độ đàn hồi và khả năng phục hồi hình dạng sau khi chịu lực. Thiết kế hướng đến người dùng yêu thích cảm giác nâng đỡ ổn định, có độ nảy và không quá bồng bềnh như gối sợi thông thường.",
    specs: [
      ["Kích thước", "60 × 40 cm"], ["Chiều cao", "Khoảng 10 cm"], ["Ruột gối", "Natural Latex"],
      ["Vỏ gối", "Cotton hoặc Tencel pha cotton"], ["Độ mềm", "Trung bình – khá chắc"], ["Độ đầy đặn", "Cấu trúc cố định"],
      ["Đặc tính", "Đàn hồi, phục hồi hình dạng"],
    ],
    highlights: [
      "Lõi cao su có cấu trúc lỗ thông khí.", "Độ đàn hồi tốt, nhanh phục hồi hình dạng.",
      "Cảm giác nâng đỡ rõ ràng và ổn định.", "Vỏ gối tháo rời để vệ sinh.",
    ],
    reason: "Phù hợp với khách hàng muốn trải nghiệm chất liệu cao cấp, chú trọng độ đàn hồi và chất lượng hoàn thiện.",
    shape: "rect", material: "latex", fill: "Natural Latex",
    feel: ["firm", "balanced"], height: ["medium", "high"], fullness: ["high"],
    positions: ["back", "side"], purposes: ["home"], quality: ["elastic", "durable", "shape", "clean"],
  },
  {
    id: "n08", code: "N08", name: "Contour", price: 520000, collection: "sleep",
    category: "Gối ngủ", img: "assets/img/products/n08.jpg", tone: "#E3E6EA",
    tagline: "Đường cong công thái học, hai vùng chiều cao",
    description:
      "Contour được thiết kế với cấu trúc công thái học, sử dụng lõi Memory Foam nguyên khối có khả năng thích ứng theo hình dáng đầu và cổ khi chịu lực. Thiết kế bề mặt dạng đường cong với hai vùng chiều cao, cho phép khách hàng lựa chọn vị trí nằm phù hợp với tư thế và đặc điểm cơ thể.",
    specs: [
      ["Kích thước", "60 × 40 cm"], ["Chiều cao vùng giữa", "Khoảng 8 cm"], ["Chiều cao hai bên", "Khoảng 10–11 cm"],
      ["Ruột gối", "Viscoelastic Memory Foam"], ["Vỏ gối", "Vải dệt kim thoáng khí"], ["Độ mềm", "Trung bình"],
      ["Đặc tính", "Ôm theo hình dáng, chậm đàn hồi"],
    ],
    highlights: [
      "Thiết kế đường cong hỗ trợ vùng đầu và cổ.", "Hai vùng chiều cao khác nhau.",
      "Lõi foam chậm đàn hồi, có khả năng thích ứng theo lực tác động.", "Vỏ gối có khóa kéo để tháo rời.",
    ],
    reason: "Dành cho người muốn trải nghiệm dòng gối có cấu trúc chuyên biệt, chú trọng cảm giác nâng đỡ và thiết kế công thái học.",
    shape: "contour", material: "memory", fill: "Viscoelastic Memory Foam",
    feel: ["balanced"], height: ["medium", "high"], fullness: ["high"],
    positions: ["side", "back"], purposes: ["home"], quality: ["elastic", "shape", "clean"],
  },
  {
    id: "n09", code: "N09", name: "Hug", price: 399000, collection: "sleep",
    category: "Gối ôm dài", img: "assets/img/products/n09.jpg", tone: "#EFE6DC",
    tagline: "Gối ôm dài, mềm mại và thoáng khí",
    description:
      "Hug là dòng gối ôm dài dành cho những người yêu thích cảm giác ôm gối khi ngủ hoặc nghỉ ngơi. Thiết kế thuôn dài, hai đầu bo tròn cùng độ mềm mại và đàn hồi vừa phải, giúp người dùng thoải mái ôm khi nằm nghiêng, đọc sách hoặc thư giãn.",
    specs: [
      ["Kích thước", "120 × 35 cm"], ["Độ dày", "12–15 cm"], ["Kiểu dáng", "Hình chữ nhật, hai đầu bo tròn, thân phồng"],
      ["Ruột gối", "Sợi Polyester Siliconized Hollow Conjugated Fiber"], ["Vỏ gối", "Cotton 100%, mềm mại, thoáng khí"],
      ["Tính năng", "Ôm khi ngủ, hỗ trợ tạo điểm tựa khi nằm nghiêng, có khóa kéo ẩn để tháo vỏ vệ sinh"],
    ],
    highlights: [
      "Thiết kế thuôn dài, hai đầu bo tròn.", "Độ mềm mại và đàn hồi vừa phải.",
      "Tạo điểm tựa khi nằm nghiêng.", "Khóa kéo ẩn, dễ tháo vỏ vệ sinh.",
    ],
    reason: "Phù hợp với người thích ôm gối khi ngủ, nằm nghiêng hoặc thư giãn tại nhà.",
    shape: "long", material: "hollow", fill: "Siliconized Hollow Conjugated Fiber",
    feel: ["soft"], height: [], fullness: ["full"],
    positions: ["side"], purposes: ["home", "multi"], quality: ["soft", "elastic", "clean"],
  },
  {
    id: "n10", code: "N10", name: "Rest", price: 299000, collection: "move",
    category: "Gối văn phòng", img: "assets/img/products/n10.jpg", tone: "#E6E8E6",
    tagline: "Khoảng nghỉ ngắn tại văn phòng",
    description:
      "Rest được phát triển dành cho những khoảng nghỉ ngắn tại văn phòng, đặc biệt khi người dùng cần tựa đầu và thư giãn trên ghế làm việc hoặc ghế có khả năng ngả lưng. Thiết kế chữ U ôm quanh vùng cổ, kết hợp lõi Memory Foam cắt nhỏ có độ đàn hồi nhằm tạo cảm giác nâng đỡ vừa phải. Sản phẩm có kích thước gọn nhẹ, thuận tiện bố trí tại bàn làm việc hoặc mang theo khi cần thiết.",
    specs: [
      ["Kích thước", "Khoảng 29 × 28 cm"], ["Độ dày", "9–10 cm"], ["Kiểu dáng", "Chữ U"], ["Ruột gối", "Shredded Memory Foam"],
      ["Vỏ gối", "Vải dệt kim co giãn kết hợp Mesh"], ["Tính năng", "Nâng đỡ vùng cổ khi nghỉ ngắn"], ["Thiết kế", "Khóa cài phía trước"],
    ],
    highlights: [
      "Thiết kế chữ U giúp ôm quanh vùng cổ.", "Lõi Memory Foam có khả năng thích ứng với lực tác động.",
      "Vỏ gối tháo rời, dễ vệ sinh.", "Nhỏ gọn, phù hợp không gian làm việc.",
    ],
    reason: "Dành cho nhân viên văn phòng, sinh viên hoặc người thường xuyên nghỉ ngắn tại nơi làm việc.",
    shape: "u", material: "memory", fill: "Shredded Memory Foam",
    feel: ["balanced"], height: ["medium"], fullness: ["medium"],
    positions: [], purposes: ["office"], quality: ["elastic", "clean", "light"],
  },
  {
    id: "n11", code: "N11", name: "Move Travel", price: 159000, collection: "move",
    category: "Gối chữ U", img: "assets/img/products/n11.jpg", tone: "#E9E4DF",
    tagline: "Người bạn đồng hành mỗi chuyến đi",
    description:
      "Move Travel là người bạn đồng hành trong những chuyến đi xa, từ máy bay, tàu hỏa đến ô tô. Sản phẩm sở hữu thiết kế chữ U ôm quanh vùng cổ, có lượn sóng nhẹ, kết hợp ruột gối bằng sợi Polyester rỗng liên hợp có trọng lượng nhẹ và độ đàn hồi. Cấu trúc mềm mại giúp người dùng có cảm giác dễ chịu khi tựa đầu trong quá trình di chuyển.",
    specs: [
      ["Kích thước", "Khoảng 30 × 28 cm"], ["Độ dày", "9–11 cm"], ["Kiểu dáng", "Chữ U"], ["Ruột gối", "Siliconized Hollow Fiber"],
      ["Vỏ gối", "Polyester-Spandex mềm"], ["Trọng lượng mục tiêu", "200–300 g"], ["Thiết kế", "Khóa cài phía trước"],
    ],
    highlights: [
      "Thiết kế chữ U ôm quanh vùng cổ.", "Ruột gối nhẹ, mềm và có độ đàn hồi.",
      "Có khóa cài giúp hạn chế gối bị xê dịch.", "Vỏ gối có thể tháo rời để vệ sinh.",
      "Thuận tiện mang theo khi đi du lịch và công tác.",
    ],
    reason: "Phù hợp với người thường xuyên di chuyển và muốn có một sản phẩm hỗ trợ vùng cổ nhỏ gọn, dễ sử dụng.",
    shape: "u", material: "hollow", fill: "Siliconized Hollow Fiber",
    feel: ["soft"], height: ["medium"], fullness: ["medium"],
    positions: [], purposes: ["travel"], quality: ["light", "clean", "soft"],
  },
  {
    id: "n12", code: "N12", name: "Mini", price: 199000, collection: "move",
    category: "Gối du lịch nhỏ gọn", img: "assets/img/products/n12.jpg", tone: "#E7E2E5",
    tagline: "Nhỏ gọn, đa dụng, nén gọn khi di chuyển",
    description:
      "Mini được thiết kế dành cho những người yêu thích sự tiện lợi và linh hoạt khi di chuyển. Khác với thiết kế chữ U, sản phẩm có hình dáng chữ nhật nhỏ gọn, dễ dàng đặt trong hành lý hoặc balo. Cấu trúc bên trong sử dụng sợi Polyester Microfiber nhẹ, tạo cảm giác mềm mại và có thể nén gọn khi bảo quản.",
    specs: [
      ["Kích thước", "Khoảng 30 × 20 cm"], ["Độ dày", "7–8 cm"], ["Kiểu dáng", "Chữ nhật mini"], ["Cấu trúc bên trong", "Siliconized Microfiber"],
      ["Chất liệu bề mặt", "Cotton pha Polyester"], ["Trọng lượng mục tiêu", "150–250 g"], ["Phụ kiện", "Túi đựng gọn nhẹ"],
    ],
    highlights: [
      "Kích thước nhỏ, dễ dàng mang theo.", "Trọng lượng nhẹ, thuận tiện bảo quản.",
      "Có thể sử dụng khi nghỉ ngắn tại văn phòng, trên xe hoặc khi lưu trú.",
      "Túi đựng riêng giúp hạn chế bụi bẩn trong quá trình di chuyển.",
    ],
    reason: "Dành cho người muốn sở hữu một sản phẩm nhỏ gọn, đa dụng, có thể gấp lại khi di chuyển.",
    shape: "mini", material: "microfiber", fill: "Siliconized Microfiber",
    feel: ["soft"], height: ["low"], fullness: ["low"],
    positions: [], purposes: ["travel", "office", "multi"], quality: ["light", "clean", "soft"],
  },
];

/* Pillow Quiz */
const QUIZ = [
  {
    key: "purpose", title: "Bạn dự định sử dụng sản phẩm chủ yếu cho mục đích nào?",
    options: [
      ["home", "Sử dụng hằng ngày khi ngủ tại nhà"], ["office", "Sử dụng tại văn phòng, nơi làm việc"],
      ["travel", "Mang theo khi đi du lịch hoặc di chuyển"], ["multi", "Sử dụng cho nhiều mục đích khác"],
    ],
  },
  {
    key: "position", title: "Bạn hay nằm theo tư thế nào?",
    options: [["side", "Nằm nghiêng"], ["back", "Nằm ngửa"], ["stomach", "Nằm sấp"], ["mixed", "Thường xuyên thay đổi tư thế"]],
  },
  {
    key: "feel", title: "Bạn mong muốn cảm giác như thế nào khi sử dụng?",
    options: [
      ["verysoft", "Rất mềm, êm ái và nhẹ nhàng"], ["soft", "Mềm vừa phải, có độ êm nhất định"],
      ["balanced", "Cân bằng giữa độ êm và độ chắc chắn"], ["firm", "Khá chắc, hạn chế cảm giác lún"],
    ],
  },
  {
    key: "height", title: "Bạn thích sản phẩm có chiều cao như thế nào?",
    options: [
      ["low", "Thấp – thiết kế gọn, độ nâng nhẹ"], ["medium", "Trung bình – chiều cao cân đối"],
      ["high", "Cao – độ nâng rõ rệt"], ["flex", "Linh hoạt – cần được tư vấn theo nhu cầu sử dụng"],
    ],
  },
  {
    key: "fullness", title: "Bạn mong muốn sản phẩm có độ đầy đặn ra sao?",
    options: [
      ["low", "Ít phồng, nhẹ và gọn"], ["medium", "Phồng vừa phải, cân đối"],
      ["full", "Đầy đặn, bồng bềnh"], ["high", "Phồng cao, duy trì hình dáng rõ ràng"],
    ],
  },
  {
    key: "quality", multi: true, title: "Bạn ưu tiên những tiêu chí chất lượng nào?",
    hint: "Có thể chọn nhiều đáp án",
    options: [
      ["soft", "Chất liệu mềm mại, dễ chịu khi tiếp xúc"], ["elastic", "Độ đàn hồi và khả năng phục hồi hình dáng"],
      ["shape", "Khả năng duy trì độ đầy đặn, hạn chế biến dạng"], ["durable", "Độ bền và chất lượng hoàn thiện"],
      ["light", "Trọng lượng nhẹ, thuận tiện khi di chuyển"], ["clean", "Dễ vệ sinh và bảo quản"],
    ],
  },
  {
    key: "budget", title: "Ngân sách dự kiến của bạn cho sản phẩm là bao nhiêu?",
    options: [
      ["b1", "100.000 – dưới 200.000 VNĐ"], ["b2", "200.000 – dưới 350.000 VNĐ"],
      ["b3", "350.000 – 500.000 VNĐ"], ["b4", "Trên 500.000 VNĐ"],
    ],
  },
];

const BUDGETS = { b1: [100000, 199999], b2: [200000, 349999], b3: [350000, 500000], b4: [500001, Infinity] };

/* Điểm cho mỗi lần khớp */
const QUIZ_WEIGHTS = { purpose: 5, feel: 4, height: 3, fullness: 2, position: 1, quality: 2 };

const QUALITY_LABELS = {
  soft: "chất liệu mềm mại", elastic: "độ đàn hồi tốt", shape: "giữ form đầy đặn",
  durable: "độ bền và hoàn thiện cao", light: "trọng lượng nhẹ", clean: "dễ vệ sinh",
};
const PURPOSE_LABELS = { home: "ngủ tại nhà", office: "nghỉ tại văn phòng", travel: "du lịch, di chuyển", multi: "nhiều mục đích" };
const POSITION_LABELS = { side: "nằm nghiêng", back: "nằm ngửa", stomach: "nằm sấp", mixed: "hay đổi tư thế" };

/* Góc kiến thức */
const ARTICLES = [
  {
    slug: "kien-thuc-giac-ngu-va-lua-chon-goi", title: "Kiến thức về giấc ngủ và lựa chọn gối",
    tag: "Giấc ngủ", minutes: 5, img: "assets/img/hero.jpg", tone: "#EFE6E6", cover: true,
    excerpt: "Ngủ đủ giấc giúp cơ thể phục hồi năng lượng, hỗ trợ trí nhớ và cân bằng cảm xúc. Bên cạnh thói quen sinh hoạt lành mạnh, chọn đúng chiếc gối cũng rất đáng quan tâm.",
    body: [
      ["p", "Một giấc ngủ chất lượng đóng vai trò quan trọng đối với sức khỏe thể chất và tinh thần. Ngủ đủ giấc giúp cơ thể phục hồi năng lượng, hỗ trợ trí nhớ, cải thiện khả năng tập trung và cân bằng cảm xúc. Để có được giấc ngủ thoải mái, bên cạnh thói quen sinh hoạt lành mạnh, việc lựa chọn một chiếc gối phù hợp cũng rất đáng quan tâm."],
      ["h", "1. Vì sao cần lựa chọn gối phù hợp?"],
      ["p", "Gối là vật dụng nâng đỡ đầu và cổ trong suốt thời gian ngủ. Một chiếc gối phù hợp giúp duy trì tư thế nằm tự nhiên, hạn chế cảm giác khó chịu do nâng đỡ không phù hợp và mang lại sự thoải mái khi nghỉ ngơi."],
      ["h", "2. Chọn gối theo tư thế ngủ"],
      ["ul", [
        "<b>Nằm nghiêng:</b> Nên chọn gối có độ cao đủ để lấp khoảng trống giữa đầu và vai, giúp cổ được nâng đỡ.",
        "<b>Nằm ngửa:</b> Ưu tiên gối có độ cao vừa phải, hỗ trợ đầu và cổ ở tư thế tự nhiên.",
        "<b>Nằm sấp:</b> Nên cân nhắc gối thấp, mỏng để tránh khiến cổ bị ngửa quá mức.",
      ]],
      ["h", "3. Những yếu tố cần cân nhắc khi chọn gối"],
      ["ul", [
        "<b>Kích thước:</b> Lựa chọn kích thước phù hợp với vóc dáng, thói quen ngủ và không gian sử dụng. Một số kích thước phổ biến gồm 50 × 70 cm, 50 × 75 cm và 50 × 90 cm.",
        "<b>Chất liệu:</b> Mỗi chất liệu mang lại cảm giác khác nhau. Polyester thường nhẹ và có nhiều lựa chọn về độ mềm; Memory Foam có khả năng ôm theo hình dáng đầu và cổ; Latex có độ đàn hồi tốt.",
        "<b>Độ cao và độ mềm:</b> Không nên chỉ chọn gối theo cảm giác mềm mại. Hãy cân nhắc khả năng nâng đỡ và sự phù hợp với tư thế ngủ.",
        "<b>Vóc dáng và nệm:</b> Chiều rộng vai, đặc điểm cơ thể và độ lún của nệm cũng ảnh hưởng đến độ cao gối phù hợp.",
      ]],
      ["h", "4. Cách bảo quản và thời điểm thay gối"],
      ["ul", [
        "Vệ sinh vỏ gối thường xuyên và làm sạch sản phẩm theo hướng dẫn của nhà sản xuất.",
        "Giữ gối khô ráo, thông thoáng để hạn chế ẩm mốc.",
        "Kiểm tra tình trạng gối định kỳ.",
        "Cân nhắc thay gối khi sản phẩm bị xẹp, biến dạng, mất độ đàn hồi hoặc không còn mang lại cảm giác nâng đỡ thoải mái.",
      ]],
      ["h", "Tìm chiếc gối phù hợp với bạn"],
      ["p", "Mỗi người có một tư thế ngủ, sở thích và nhu cầu nghỉ ngơi riêng. Vì vậy, không có một chiếc gối duy nhất phù hợp với tất cả mọi người."],
      ["p", "Hãy để NESTORA giúp bạn khám phá chiếc gối dành riêng cho mình! Tham gia bài Pillow Quiz để tìm hiểu nhu cầu, sở thích và nhận gợi ý sản phẩm phù hợp."],
      ["quote", "NESTORA – Comfort is Personal. Thoải mái theo cách riêng của bạn."],
    ],
  },
  {
    slug: "chon-chieu-cao-goi", title: "Chọn chiều cao gối phù hợp với tư thế nằm",
    tag: "Hướng dẫn chọn gối", minutes: 4, img: "assets/img/products/n04.jpg", tone: "#E7E1EA",
    excerpt: "Chiều cao gối là yếu tố ảnh hưởng nhiều nhất đến cảm giác thoải mái. Cùng tìm hiểu cách chọn theo thói quen nằm của bạn.",
    body: [
      ["p", "Không có một chiều cao gối \"chuẩn\" cho tất cả mọi người. Chiều cao phù hợp phụ thuộc vào tư thế nằm, độ rộng vai và độ lún của nệm bạn đang dùng."],
      ["h", "Người hay nằm nghiêng"],
      ["p", "Khi nằm nghiêng, khoảng trống giữa đầu và nệm lớn nhất. Một chiếc gối cao 10–12 cm, đầy đặn và giữ form tốt như Form Support thường mang lại cảm giác ổn định hơn."],
      ["h", "Người hay nằm ngửa"],
      ["p", "Chiều cao trung bình khoảng 8–10 cm là lựa chọn phổ biến. Nếu bạn thích mềm, hãy cân nhắc Mellow; nếu thích cân bằng giữa êm và chắc, Balance là gợi ý đáng thử."],
      ["h", "Người hay nằm sấp"],
      ["p", "Nên ưu tiên gối thấp, mỏng như Low Profile (6–8 cm). Trong một số trường hợp, người nằm sấp có thể cảm thấy thoải mái hơn khi không dùng gối đầu."],
      ["h", "Chưa chắc chắn?"],
      ["p", "Gối có thể điều chỉnh như Flex Adjustable cho phép bạn thêm hoặc bớt ruột gối cho đến khi tìm được độ cao ưng ý."],
    ],
  },
  {
    slug: "so-sanh-chat-lieu-ruot-goi", title: "Microfiber, Memory Foam hay Latex: khác nhau thế nào?",
    tag: "Chất liệu", minutes: 5, img: "assets/img/products/n07.jpg", tone: "#EFE6E2",
    excerpt: "Mỗi chất liệu ruột gối tạo ra một cảm giác riêng. Hiểu rõ đặc tính giúp bạn chọn đúng cảm giác mình yêu thích.",
    body: [
      ["p", "Chất liệu ruột gối quyết định độ mềm, độ đàn hồi và khả năng giữ form của sản phẩm. Dưới đây là bốn nhóm chất liệu NESTORA đang sử dụng."],
      ["h", "Microfiber Polyester"],
      ["p", "Sợi siêu mảnh, nhẹ và bồng bềnh. Cảm giác mềm mại, phù hợp người thích gối êm. Có mặt trong Mellow, Low Profile, Cloud Plush và Mini."],
      ["h", "Sợi rỗng liên hợp phủ silicon"],
      ["p", "Cấu trúc sợi rỗng giúp tăng độ đàn hồi và phục hồi hình dáng. Cân bằng giữa êm và chắc – điển hình là Balance và Hug."],
      ["h", "Memory Foam"],
      ["p", "Chậm đàn hồi, ôm theo hình dáng đầu và cổ. Dạng nguyên khối (Contour) cho cấu trúc ổn định, dạng cắt nhỏ (Form Support, Rest) linh hoạt hơn."],
      ["h", "Latex thiên nhiên"],
      ["p", "Lõi cao su có lỗ thông khí, độ nảy tốt và phục hồi nhanh. Đây là chất liệu của dòng cao cấp Signature Comfort."],
    ],
  },
  {
    slug: "bao-quan-goi", title: "5 thói quen giúp gối luôn bồng bềnh và bền lâu",
    tag: "Chăm sóc gối", minutes: 3, img: "assets/img/products/n06.jpg", tone: "#DFE9E5",
    excerpt: "Một chút chăm sóc mỗi tuần giúp ruột gối giữ độ phồng và vỏ gối luôn sạch sẽ, thơm mát.",
    body: [
      ["p", "Gối được sử dụng mỗi ngày nên cần được chăm sóc đúng cách để giữ được cảm giác như lúc mới mua."],
      ["h", "1. Vỗ gối mỗi sáng"],
      ["p", "Với gối sợi, vỗ nhẹ hai bên giúp các cụm sợi tơi ra và phân bố đều."],
      ["h", "2. Giặt vỏ gối định kỳ"],
      ["p", "Hầu hết sản phẩm NESTORA có vỏ khóa kéo tháo rời. Nên giặt vỏ gối 1–2 tuần một lần."],
      ["h", "3. Phơi thoáng ruột gối"],
      ["p", "Phơi ruột gối ở nơi thoáng mát, tránh nắng gắt trực tiếp – đặc biệt với memory foam và latex."],
      ["h", "4. Dùng thêm áo gối bảo vệ"],
      ["p", "Một lớp áo gối bảo vệ giúp hạn chế mồ hôi và bụi bẩn thấm vào ruột gối."],
      ["h", "5. Thay gối khi cần"],
      ["p", "Khi gối không còn phục hồi hình dáng sau khi gấp đôi, đó là lúc nên cân nhắc thay mới."],
    ],
  },
  {
    slug: "goi-cho-chuyen-di", title: "Nghỉ ngơi trọn vẹn trên những chuyến đi dài",
    tag: "Move Collection", minutes: 3, img: "assets/img/products/n11.jpg", tone: "#F3DFD7",
    excerpt: "Gối chữ U hay gối mini? Gợi ý cách chọn gối du lịch và nghỉ trưa văn phòng phù hợp nhu cầu.",
    body: [
      ["p", "Những khoảng nghỉ ngắn trên máy bay, xe khách hay tại bàn làm việc cũng xứng đáng được thoải mái."],
      ["h", "Gối chữ U – Move Travel"],
      ["p", "Ôm quanh vùng cổ, có khóa cài phía trước giúp gối không xê dịch. Nhẹ chỉ 200–300 g, phù hợp đi máy bay, tàu, ô tô."],
      ["h", "Gối văn phòng – Rest"],
      ["p", "Lõi memory foam cắt nhỏ, nâng đỡ vừa phải khi tựa đầu trên ghế làm việc hoặc ghế ngả lưng."],
      ["h", "Gối mini – Mini"],
      ["p", "Hình chữ nhật nhỏ gọn, nén gọn trong túi đựng riêng. Đa dụng: nghỉ trưa, ngủ trên xe, mang theo khi lưu trú."],
    ],
  },
];

/* Mạng xã hội – thay đường dẫn bằng trang chính thức của NESTORA */
const SOCIALS = [
  { name: "TikTok", url: "https://www.tiktok.com/",
    svg: '<path fill="currentColor" stroke="none" d="M16.6 3c.4 2.3 1.9 3.8 4.2 4v3.2c-1.5 0-2.9-.4-4.2-1.2v6.3c0 3.6-2.7 5.9-5.8 5.9-3.2 0-5.6-2.5-5.6-5.6 0-3.5 3.2-6.1 6.7-5.5v3.3c-1.6-.4-3.3.6-3.3 2.3 0 1.3 1 2.4 2.3 2.4 1.5 0 2.4-1 2.4-2.7V3z"/>' },
  { name: "Facebook", url: "https://www.facebook.com/",
    svg: '<path fill="currentColor" stroke="none" d="M14 8.5V6.8c0-.8.5-1 .9-1H17V2.2h-2.9c-3.2 0-3.9 2.4-3.9 4v2.3H8v3.7h2.2V22h3.8v-9.8h3l.4-3.7z"/>' },
  { name: "Instagram", url: "https://www.instagram.com/",
    svg: '<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5"/><circle cx="12" cy="12" r="4.1"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/>' },
  { name: "X", url: "https://x.com/",
    svg: '<path fill="currentColor" stroke="none" d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.9 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z"/>' },
  { name: "Pinterest", url: "https://www.pinterest.com/",
    svg: '<path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.5 1.8-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.9 1.6 1.9 1.9 0 3.3-2 3.3-4.9 0-2.6-1.8-4.3-4.5-4.3-3 0-4.8 2.3-4.8 4.6 0 .9.4 1.9.8 2.4l.1.4-.3 1.2c0 .2-.2.3-.4.2-1.4-.6-2.2-2.6-2.2-4.2 0-3.4 2.5-6.6 7.2-6.6 3.8 0 6.7 2.7 6.7 6.3 0 3.7-2.4 6.8-5.7 6.8-1.1 0-2.2-.6-2.5-1.3l-.7 2.6c-.3 1-.9 2.2-1.4 2.9A10 10 0 1 0 12 2z"/>' },
];

/* Chatbox FAQ */
const FAQ = [
  { q: "Phí giao hàng bao nhiêu?", k: ["phí", "ship", "giao", "vận chuyển"],
    a: "Miễn phí giao hàng cho đơn từ 500.000₫. Đơn dưới 500.000₫ áp dụng phí 30.000₫. Thời gian giao 2–4 ngày làm việc (nội thành 1–2 ngày)." },
  { q: "Chính sách đổi trả như thế nào?", k: ["đổi", "trả", "hoàn"],
    a: "NESTORA hỗ trợ đổi sản phẩm trong 7 ngày nếu sản phẩm còn nguyên tem, vỏ bọc và chưa qua giặt. Sản phẩm lỗi do nhà sản xuất được đổi mới miễn phí." },
  { q: "Bảo hành bao lâu?", k: ["bảo hành", "bao lâu", "lỗi"],
    a: "Ruột gối được bảo hành 12 tháng với lỗi xẹp lún bất thường, bung đường may. Dòng Signature Comfort và Contour được bảo hành 24 tháng." },
  { q: "Có những hình thức thanh toán nào?", k: ["thanh toán", "chuyển khoản", "cod", "trả tiền"],
    a: "Bạn có thể thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng hoặc thanh toán trực tuyến (thẻ / ví điện tử)." },
  { q: "Làm sao chọn được gối phù hợp?", k: ["chọn", "phù hợp", "tư vấn", "quiz", "gối nào"],
    a: "Bạn hãy thử Pillow Quiz – chỉ 7 câu hỏi để NESTORA gợi ý những mẫu gối hợp với sở thích của bạn nhất.", link: ["#quiz", "Làm Pillow Quiz"] },
  { q: "Theo dõi đơn hàng ở đâu?", k: ["theo dõi", "đơn hàng", "trạng thái", "tra cứu"],
    a: "Bạn có thể tra cứu trạng thái đơn hàng bằng mã đơn tại trang Theo dõi đơn hàng.", link: ["#track", "Theo dõi đơn hàng"] },
  { q: "Vệ sinh gối như thế nào?", k: ["vệ sinh", "giặt", "bảo quản"],
    a: "Phần lớn vỏ gối NESTORA có khóa kéo, có thể tháo ra giặt nhẹ. Ruột gối nên phơi thoáng, tránh nắng gắt. Xem thêm tại Góc kiến thức.", link: ["#journal-bao-quan-goi", "Đọc bài viết"] },
];
