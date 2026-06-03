const sendLeaveEmail = async (employeeEmail, employeeName, status, leaveType, startDate, endDate) => {
  try {
    const isApproved = status === 'approved';
    const statusText = isApproved ? 'تمت الموافقة على' : 'تم رفض';
    const color = isApproved ? '#10b981' : '#ef4444'; 
    const typeInArabic = leaveType === 'annual' ? 'إجازة اعتيادية' : leaveType === 'casual' ? 'إجازة عارضة' : 'بدل راحة';

    // تصميم الإيميل
    const htmlTemplate = `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; border-top: 5px solid ${color}; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #1f2937;">مرحباً ${employeeName}،</h2>
          <p style="font-size: 16px; color: #4b5563;">
            نود إعلامك بأنه <strong>${statusText}</strong> طلب الإجازة الخاص بك من قبل الإدارة.
          </p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>نوع الإجازة:</strong> ${typeInArabic}</p>
            <p style="margin: 0 0 10px 0;"><strong>من تاريخ:</strong> ${new Date(startDate).toLocaleDateString('ar-EG')}</p>
            <p style="margin: 0;"><strong>إلى تاريخ:</strong> ${new Date(endDate).toLocaleDateString('ar-EG')}</p>
          </div>
          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
            هذه رسالة تلقائية من نظام السيطرة المركزية، برجاء عدم الرد عليها.
          </p>
        </div>
      </div>
    `;

    // ⚠️ مهم: الزق الرابط الطويل بتاع جوجل هنا بين علامات التنصيص
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz3lN4bo6fd7Gj-THSe4KMNFdwG-2iMEA3HrZsxRK7b3WNZRu7D-tM6_mpfJoKSIBY9/exec';

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        to: employeeEmail,
        subject: `تحديث بخصوص طلب الإجازة: ${statusText}`,
        htmlBody: htmlTemplate
      })
    });

    const result = await response.json();
    if (result.status === 'success') {
      console.log(`✅ Email sent successfully via Webhook to: ${employeeEmail}`);
    } else {
      console.error('❌ Error from Google Script:', result.message);
    }

  } catch (error) {
    console.error('❌ Error sending email:', error.message);
  }
};

module.exports = sendLeaveEmail;