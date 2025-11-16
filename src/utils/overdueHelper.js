export const checkOverduePayments = (tenants, payments) => {
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7);
  
  const overdueList = [];
  
  tenants.forEach(tenant => {
    if (tenant.status !== 'active') return;
    
    // Check if payment exists for current month
    const currentMonthPayment = payments.find(
      p => p.tenantId === tenant.id && p.month === currentMonth
    );
    
    if (!currentMonthPayment && today.getDate() > 5) {
      // If no payment and past 5th of month, mark as overdue
      overdueList.push({
        ...tenant,
        overdueMonth: currentMonth,
        daysOverdue: today.getDate() - 5,
        overdueAmount: tenant.rentAmount
      });
    }
  });
  
  return overdueList;
};

export const getOverdueMonths = (tenant, payments) => {
  const overdueMonths = [];
  const today = new Date();
  const moveInDate = new Date(tenant.moveInDate);
  
  // Check last 6 months
  for (let i = 0; i < 6; i++) {
    const checkDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    
    // Don't check months before tenant moved in
    if (checkDate < moveInDate) continue;
    
    const monthStr = checkDate.toISOString().slice(0, 7);
    const payment = payments.find(
      p => p.tenantId === tenant.id && p.month === monthStr
    );
    
    if (!payment) {
      overdueMonths.push({
        month: monthStr,
        monthName: checkDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        amount: tenant.rentAmount
      });
    }
  }
  
  return overdueMonths;
};