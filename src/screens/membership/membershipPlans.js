const CONTACT_PHONE = '0772149829';

export const membershipPlans = [
  {
    id: 'basic',
    name: 'Basic',
    caption: 'Không gian tập cơ bản cho người mới',
    badge: 'Gói cơ bản',
    price: '490.000đ/tháng',
    accent: '#FFEFE1',
    accentText: '#C2621A',
    cardColor: '#FFF9F4',
    image: require('@assets/images/cardmemberclassic.png'),
    summary: [
      'Không giới hạn khu cardio, tạ, máy tập',
      'Locker tiêu chuẩn, tiện ích cơ bản',
      'Không tham gia lớp nhóm hoặc ưu đãi PT',
    ],
    details: [
      'Truy cập không giới hạn khu cardio, tạ, máy tập',
      'Locker tiêu chuẩn, phòng tắm/xông hơi chung',
      'Không tham gia lớp nhóm (quét mã báo "Không thuộc gói")',
      'Cho phép mua lẻ từng lớp (Pay-per-class) nếu cần',
      'Không bao gồm khăn, nước hay ưu đãi PT',
    ],
    perks: [
      'Truy cập khu tập chính 24/7',
      'Locker tiêu chuẩn dùng chung',
      'Dịch vụ phòng tắm/xông hơi chung (nếu có)',
    ],
    restrictions: [
      'Không tham gia lớp Group X/Training',
      'Không có khăn, nước miễn phí',
      'Không ưu đãi dịch vụ PT',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    caption: 'Gói tiêu chuẩn cho đa số hội viên',
    badge: 'Ưa chuộng',
    price: '890.000đ/tháng',
    accent: '#E7F2FF',
    accentText: '#0F6AE6',
    cardColor: '#F8FBFF',
    image: require('@assets/images/cardmemberplus.png'),
    summary: [
      'Bao gồm toàn bộ quyền lợi gói Basic',
      'Booking & tham gia không giới hạn lớp Training',
      'Tặng PT định hướng + nước uống miễn phí',
    ],
    details: [
      'Bao gồm toàn bộ quyền lợi gói Basic',
      'Tham gia & booking KHÔNG GIỚI HẠN mọi lớp Training',
      'Mở tính năng đặt chỗ lớp ngay trên app',
      'Tặng 1-2 buổi PT định hướng khi đăng ký lần đầu',
      'Nước uống miễn phí, tiện ích cơ bản',
      'Không bao gồm khăn cao cấp/ưu đãi PT đặc biệt',
    ],
    perks: [
      'Tham gia vô hạn Yoga, Dance, HIIT...',
      'Đặt chỗ lớp trên app GymXFit',
      '01-02 buổi PT định hướng miễn phí',
      'Nước uống miễn phí tại quầy',
    ],
    restrictions: [
      'Không bao gồm khăn cao cấp',
      'Ưu đãi PT chỉ ở mức cơ bản',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    caption: 'Trải nghiệm trọn gói & ưu đãi PT',
    badge: 'VIP',
    price: '1.290.000đ/tháng',
    accent: '#FCE7FF',
    accentText: '#A629C3',
    cardColor: '#FDF8FF',
    image: require('@assets/images/cardmembervip.png'),
    summary: [
      'Bao gồm toàn bộ quyền lợi gói Plus',
      'Khăn, nước miễn phí & tủ đồ VIP',
      'Ưu đãi PT định kỳ + guest pass cho người thân',
    ],
    details: [
      'Bao gồm toàn bộ quyền lợi gói Plus',
      'Khăn tập lớn/nhỏ + nước suối hoặc detox miễn phí',
      'Tủ đồ riêng/khu locker VIP (tuỳ chi nhánh)',
      'Tặng 1-2 buổi PT miễn phí mỗi tháng',
      'Giảm 10-20% khi mua các gói PT (auto áp dụng trên app)',
      'Guest Pass: dẫn bạn bè/người thân 4 lần/tháng',
    ],
    perks: [
      'Khăn cao cấp & nước detox mỗi lần tập',
      'Locker VIP/riêng tư',
      'Tặng PT hàng tháng để duy trì tiến độ',
      'Giảm giá 10-20% khi mua gói PT 10/20/50 buổi',
      'Guest Pass cho 4 lần/tháng',
    ],
    restrictions: [],
  },
];

export const getPlanById = id => membershipPlans.find(plan => plan.id === id);
export const MEMBERSHIP_CONTACT = CONTACT_PHONE;
