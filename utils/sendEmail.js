const nodemailer = require('nodemailer');

const sendLeaveEmail = async (employeeEmail, employeeName, status, leaveType, startDate, endDate) => {
  try {
    // إعداد حساب الإرسال (هيقرا من ملف الـ .env)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // إيميلك اللي هتبعت منه
        pass: process.env.EMAIL_PASS  // الـ App Password اللي هنجيبه من جوجل
      }
    });

    // تظبيط شكل وحالة الإيميل
    const isApproved = status === 'approved';
    const statusText = isApproved ? 'تمت الموافقة على' : 'تم رفض';
    const color = isApproved ? '#10b981' : '#ef4444'; // أخضر للموافقة، أحمر للرفض
    
    // ترجمة نوع الإجازة للعربي عشان شكل الإيميل
    const typeInArabic = leaveType === 'annual' ? 'إجازة اعتيادية' : leaveType === 'casual' ? 'إجازة عارضة' : 'بدل راحة';

    // قالب الإيميل (HTML)
    const mailOptions = {
      from: `"السيطرة المركزية - نظام الإجازات" <${process.env.EMAIL_USER}>`,
      to: employeeEmail,
      subject: `تحديث بخصوص طلب الإجازة: ${statusText}`,
      html: `
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
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to: ${employeeEmail}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
};

module.exports = sendLeaveEmail;