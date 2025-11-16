import emailjs from '@emailjs/browser';

// Replace with your EmailJS credentials
const EMAILJS_SERVICE_ID = 'service_f6394zr';
const EMAILJS_TEMPLATE_ID = 'template_pz2ifhi';
const EMAILJS_PUBLIC_KEY = 'bEkRDwRB8FxI_7--K';

export const sendRentReminderEmail = async (tenant, ownerName) => {
  try {
    // Check if tenant has email
    if (!tenant.email) {
      return { success: false, error: 'Tenant email not provided' };
    }

    const templateParams = {
      to_email: tenant.email, // CRITICAL: recipient email
      to_name: tenant.name,
      tenant_name: tenant.name,
      property_name: tenant.propertyName,
      room_number: tenant.roomNumber,
      rent_amount: (tenant.rentAmount / 100).toLocaleString('en-IN'),
      due_date: new Date().toLocaleDateString('en-IN'),
      owner_name: ownerName || 'Your Landlord',
      reply_to: ownerName // Optional: for replies
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    return { success: true, messageId: response.text };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.text || error.message };
  }
};


