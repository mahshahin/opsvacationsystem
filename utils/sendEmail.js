// دالة ذكية بتقبل أي عدد من المتغيرات عشان تخدم الإجازات والروستر مع بعض
const sendEmail = async (...args) => {
  try {
    let to, subject, htmlBody;

    // 1) لو الدالة استلمت 6 متغيرات أو أكثر (يبقى ده طلب من شاشة الإجازات)
    if (args.length >= 6) {
      const [
        employeeEmail,
        employeeName,
        status,
        leaveType,
        startDate,
        endDate,
      ] = args;

      const isApproved = status === "approved" || status === "Approved" || status === "approved_by_admin";
      
      let statusText = "تم رفض";
      if (status === "approved_by_admin") {
        statusText = "تم تسجيل";
      } else if (isApproved) {
        statusText = "تمت الموافقة على";
      }
      
      const color = isApproved ? "#10b981" : "#ef4444";

      const typeInArabic =
        leaveType === "annual"
          ? "إجازة اعتيادية"
          : leaveType === "casual"
            ? "إجازة عارضة"
            : "بدل أعياد";

      to = employeeEmail;
      subject = `تحديث بخصوص طلب الإجازة: ${statusText}`;

      htmlBody = `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; border-top: 5px solid ${color}; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #1f2937;">مرحباً ${employeeName}،</h2>
            <p style="font-size: 16px; color: #4b5563;">
              نود إعلامك بأنه <strong>${statusText}</strong> طلب الإجازة الخاص بك من قبل الإدارة.
            </p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>نوع الإجازة:</strong> ${typeInArabic}</p>
              <p style="margin: 0 0 10px 0;"><strong>من تاريخ:</strong> ${new Date(startDate).toLocaleDateString("ar-EG")}</p>
              <p style="margin: 0;"><strong>إلى تاريخ:</strong> ${new Date(endDate).toLocaleDateString("ar-EG")}</p>
            </div>
            <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
              هذه رسالة تلقائية من نظام السيطرة المركزية، برجاء عدم الرد عليها.
            </p>
          </div>
        </div>
      `;
    }

    // 2) لو الدالة استلمت 3 متغيرات بس (يبقى ده إشعار عام زي الروستر أو إشعار للإدارة)
    else {
      const [employeeEmail, messageSubject, textMessage] = args;

      to = employeeEmail;
      subject = messageSubject;

      htmlBody = `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; border-top: 5px solid #3b82f6; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #1f2937; margin-bottom: 20px;">إشعار من نظام السيطرة المركزية</h2>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
              <p style="font-size: 16px; color: #4b5563; margin: 0; white-space: pre-line;">
                ${textMessage}
              </p>
            </div>
            <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
              هذه رسالة تلقائية، برجاء عدم الرد عليها.
            </p>
          </div>
        </div>
      `;
    }

    const GOOGLE_SCRIPT_URL =
      "https://script.google.com/macros/s/AKfycbz3lN4bo6fd7Gj-THSe4KMNFdwG-2iMEA3HrZsxRK7b3WNZRu7D-tM6_mpfJoKSIBY9/exec";

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        to,
        subject,
        htmlBody,
      }),
    });

    const result = await response.json();

    if (result.status === "success") {
      console.log(`✅ Email sent successfully to: ${to} | Subject: ${subject}`);
    } else {
      console.error("❌ Error from Google Script:", result.message);
    }
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
  }
};

module.exports = sendEmail;
