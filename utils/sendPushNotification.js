/**
 * ملف المساعد المعدل لإرسال الإشعارات مع دعم كامل لتحديث البادج (Badge) على أيقونة التطبيق
 */
const sendPushNotification = async ({ to, title, body, badge, data = {} }) => {
  try {
    if (!to) return;

    // تحويل المستقبلين لمصفوفة دائماً لتسهيل معالجتها
    const tokens = Array.isArray(to) ? to : [to];

    // فلترة التوكنز الصالحة فقط لـ Expo
    const validTokens = tokens.filter(
      (token) =>
        typeof token === "string" && token.startsWith("ExponentPushToken"),
    );

    if (validTokens.length === 0) {
      console.log("لم يتم العثور على أي توكنز إشعارات صالحة لجهاز الموظف.");
      return;
    }

    // بناء قائمة الرسائل وإضافة بارامتر الـ badge والـ sound
    const messages = validTokens.map((token) => ({
      to: token,
      sound: "default",
      title,
      body,
      badge: badge !== undefined ? Number(badge) : 1, // تعيين البادج (القيمة الافتراضية 1 إذا لم تحدد)
      data,
      android: {
        sound: true,
        priority: "high",
        channelId: "default"
      }
    }));

    // إرسال الطلب إلى سيرفرات إشعارات إكسبو الرسمية
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log("نتيجة إرسال إشعارات Expo:", result);
  } catch (error) {
    console.error("حدث خطأ أثناء إرسال الإشعار:", error);
  }
};

module.exports = sendPushNotification;
