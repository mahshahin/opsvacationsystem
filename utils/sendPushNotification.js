const sendPushNotification = async ({ to, title, body, data = {} }) => {
  try {
    if (!to) return;

    const tokens = Array.isArray(to) ? to : [to];

    const validTokens = tokens.filter(
      (token) =>
        typeof token === "string" && token.startsWith("ExponentPushToken"),
    );

    if (validTokens.length === 0) {
      console.log("No valid Expo push tokens found.");
      return;
    }

    const messages = validTokens.map((token) => ({
      to: token,
      sound: "default",
      title,
      body,
      data,
    }));

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

    console.log("Expo push result:", result);
  } catch (error) {
    console.error("Push notification error:", error);
  }
};

module.exports = sendPushNotification;