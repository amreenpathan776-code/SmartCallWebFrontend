const sendToServer = async (level, args) => {
  try {
    const message = args
      .map(a => (typeof a === "object" ? JSON.stringify(a) : a))
      .join(" ");

    await fetch("https://mobile.coastal.bank.in:5001/api/frontend-log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "dashboard",
        message: `[${level}] ${message}`,
      }),
    });
  } catch (e) {}
};

const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = (...args) => {
  sendToServer("LOG", args);
  originalLog(...args);
};

console.warn = (...args) => {
  sendToServer("WARN", args);
  originalWarn(...args);
};

console.error = (...args) => {
  sendToServer("ERROR", args);
  originalError(...args);
};