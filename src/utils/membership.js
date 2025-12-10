const pickMembershipPayload = data => {
  if (!data) return null;
  
  // Check if 'membership' key exists explicitly (even if null)
  if (data && Object.prototype.hasOwnProperty.call(data, 'membership')) {
    return data.membership;
  }

  // Common wrappers
  if (data.user && (data.user.membership || data.user.membershipInfo || data.user.memberShip)) {
    return data.user.membership || data.user.membershipInfo || data.user.memberShip;
  }
  
  if (data.membershipInfo) return data.membershipInfo;
  if (data.memberShip) return data.memberShip;
  if (data.data && data.data.membership) return data.data.membership;
  
  return data;
};

const pickPackageInfo = membership => {
  if (!membership) return {};
  if (membership.packageId && typeof membership.packageId === 'object') return membership.packageId;
  if (membership.package && typeof membership.package === 'object') return membership.package;
  if (membership.packageInfo) return membership.packageInfo;
  if (membership.plan) return membership.plan;
  if (membership.planInfo) return membership.planInfo;
  return {};
};

export const normalizeMembership = raw => {
  const membership = pickMembershipPayload(raw);
  if (!membership || typeof membership !== 'object') return null;

  const pkg = pickPackageInfo(membership);
  const packageName = membership.packageName || pkg.name || pkg.title || '';
  const remainingClassCredits =
    membership.remainingClassCredits ??
    membership.classCredits ??
    membership.classQuota ??
    membership.remainingClasses ??
    0;
  const remainingSessions =
    membership.remainingSessions ??
    membership.remainingPtSessions ??
    membership.ptSessionsRemaining ??
    membership.remaining_sessions ??
    0;

  return {
    status: membership.status || membership.membershipStatus || pkg.status || null,
    startDate:
      membership.startDate ||
      membership.start_date ||
      membership.start ||
      membership.beginDate ||
      membership.begin_at ||
      null,
    endDate:
      membership.endDate ||
      membership.end_date ||
      membership.expireDate ||
      membership.expiryDate ||
      membership.end ||
      null,
    remainingClassCredits: Number(remainingClassCredits) || 0,
    remainingSessions: Number(remainingSessions) || 0,
    facilityAccess: membership.facilityAccess || pkg.facilityAccess || null,
    packageId: pkg._id || pkg.id || membership.packageId || membership.package_id || null,
    packageName,
    raw: membership,
  };
};

export const calculateDaysLeft = membership => {
  if (!membership?.endDate) return null;
  try {
    const end = new Date(membership.endDate);
    if (Number.isNaN(end.getTime())) return null;
    end.setHours(23, 59, 59, 999);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 0 : diffDays;
  } catch {
    return null;
  }
};
export const cycleMultipliers = {
  month: { months: 1, multiplier: 1, discount: 0 },
  quarter: { months: 3, multiplier: 3, discount: 0.2 }, // 20% off
  year: { months: 12, multiplier: 12, discount: 0.5 }, // 50% off
};

export const computeCyclePrice = (basePrice, cycle) => {
  const cfg = cycleMultipliers[cycle] || cycleMultipliers.month;
  return Math.round(basePrice * cfg.months * (1 - cfg.discount));
};

export const formatCurrency = amount => {
  if (amount === null || amount === undefined) return '—';
  const number = Number(amount);
  if (Number.isNaN(number)) return '—';
  return `${number.toLocaleString('vi-VN')}đ`;
};

export const estimateClassPricing = membershipRaw => {
  const basePrice = 250000;
  const membership = membershipRaw?.packageName ? membershipRaw : normalizeMembership(membershipRaw);
  if (!membership) {
    return {
      price: basePrice,
      note: 'Giá lớp tiêu chuẩn',
      remainingCredits: 0,
      packageName: '',
    };
  }

  const packageName = (membership.packageName || '').toString().toLowerCase();
  const remainingCredits = membership.remainingClassCredits || 0;
  const isPremium = packageName.includes('premium');
  const isPlus = packageName.includes('plus');

  if (isPremium) {
    return {
      price: 0,
      note: 'Premium: học lớp miễn phí không giới hạn',
      remainingCredits: Infinity,
      packageName: membership.packageName || 'Premium',
    };
  }

  if (isPlus && remainingCredits > 0) {
    return {
      price: 0,
      note: `Plus: còn ${remainingCredits} lượt lớp tặng`,
      remainingCredits,
      packageName: membership.packageName || 'Plus',
    };
  }

  if (isPlus) {
    const discounted = Math.round(basePrice * 0.8);
    return {
      price: discounted,
      note: 'Plus đã hết quota: giảm 20% học phí',
      remainingCredits: 0,
      packageName: membership.packageName || 'Plus',
    };
  }

  return {
    price: basePrice,
    note: 'Giá lớp tiêu chuẩn',
    remainingCredits,
    packageName: membership.packageName || '',
  };
};

export const estimatePtPricing = membershipRaw => {
  const basePrice = 350000;
  const membership = membershipRaw?.packageName ? membershipRaw : normalizeMembership(membershipRaw);
  if (!membership) {
    return {
      price: basePrice,
      note: 'Giá PT tiêu chuẩn',
      remainingSessions: 0,
      packageName: '',
    };
  }

  const packageName = (membership.packageName || '').toString().toLowerCase();
  const remainingSessions = membership.remainingSessions || 0;
  const isPremium = packageName.includes('premium');

  if (isPremium && remainingSessions > 0) {
    return {
      price: 0,
      note: `Premium: còn ${remainingSessions} buổi PT miễn phí/tháng`,
      remainingSessions,
      packageName: membership.packageName || 'Premium',
    };
  }

  if (isPremium) {
    return {
      price: basePrice,
      note: 'Premium đã hết quota PT: tính giá tiêu chuẩn',
      remainingSessions: 0,
      packageName: membership.packageName || 'Premium',
    };
  }

  return {
    price: basePrice,
    note: 'Giá PT tiêu chuẩn',
    remainingSessions,
    packageName: membership.packageName || '',
  };
};
