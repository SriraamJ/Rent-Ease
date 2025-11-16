export const sendWhatsAppReminder = (tenant, month) => {
  const monthName = new Date(month + '-01').toLocaleDateString('en-IN', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  const message = `Hello ${tenant.name},

This is a friendly reminder that your rent for ${monthName} is due.

Property: ${tenant.propertyName}
Room: ${tenant.roomNumber}
Amount: ₹${(tenant.rentAmount / 100).toLocaleString()}

Please make the payment at your earliest convenience.

Thank you!`;

  const encodedMessage = encodeURIComponent(message);
  const phoneNumber = tenant.phone.replace(/\D/g, ''); // Remove non-digits
  const whatsappUrl = `https://wa.me/+${phoneNumber}?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
};