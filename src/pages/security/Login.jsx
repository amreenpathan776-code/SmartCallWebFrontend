import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ✅ ADD THIS EXACTLY HERE
const logInfo = (msg, data) => console.log(`📡 ${msg}`, data || "");
const logSuccess = (msg, data) => console.log(`✅ ${msg}`, data || "");
const logError = (msg, data) => console.error(`❌ ${msg}`, data || "");
const logWarn = (msg, data) => console.warn(`⚠️ ${msg}`, data || "");

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [loginError, setLoginError] = useState("");

 useEffect(() => {
  logInfo("Login page loaded");
}, []);
  

  const handleLogin = async (e) => {
    e.preventDefault();
    logInfo("Login attempt started", { userId: username });
    setLoading(true);
    setLoginError("");

    try {
      logInfo("Calling login API", { userId: username });
      logInfo("Login request payload", {
  userId: username
});
      const res = await fetch("https://mobile.coastal.bank.in:5001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: username,
          password: password
        })
      });

      const data = await res.json();
      logInfo("Login API status", res.status);
      logInfo("Login API response received", data);

      if (!res.ok) {
        logWarn("Login failed", { userId: username, message: data.message });
  setLoginError(data.message || "Login failed");
  setLoading(false);
  return;
}

logSuccess("Login successful", {
  userId: data.userId,
  role: data.role,
  branch: data.branchName,
  branchCode: data.branchCode,
  cluster: data.clusterName
});

logInfo("Clearing old session");
// 🔥 Clear old session
localStorage.clear();

// Save new login data
localStorage.setItem("userId", data.userId);
localStorage.setItem("role", data.role);
localStorage.setItem("branchName", data.branchName);
localStorage.setItem("branchCode", data.branchCode);
localStorage.setItem("clusterName", data.clusterName);

logInfo("User session stored in localStorage", {
  userId: data.userId,
  role: data.role
});

logInfo("Navigating to dashboard", { userId: data.userId });
navigate("/dashboard");

    } catch (err) {
  logError("Login API unreachable", err);
      alert("Server unreachable. Try again later.");
    }

    setLoading(false);
  };

  return (
    <>
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.header}>
            Coastal Bank
            <div style={styles.subHeader}>Smart Call Dashboard</div>
          </div>

          <form onSubmit={handleLogin} style={{ padding: 24 }}>
            <label>User ID *</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => {
  logInfo("Username input changed", e.target.value);
  setUsername(e.target.value);
}}
              style={styles.input}
            />

            <label>Password *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => {
  logInfo("Password input entered"); // ❗ never log password
  setPassword(e.target.value);
}}
              style={styles.input}
            />

            {loginError && (
  <div style={{
    color: "red",
    fontSize: "13px",
    marginTop: "-10px",
    marginBottom: "12px"
  }}>
    {loginError}
  </div>
)}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.loginBtn,
                opacity: loading ? 0.8 : 1
              }}
            >
              {loading ? "Verifying..." : "Log in"}
            </button>

            <div style={{ marginTop: 12, textAlign: "center" }}>
              <button
                type="button"
                onClick={() => {
  logInfo("Forgot password modal opened");
  setShowForgot(true);
}}
                style={styles.linkBtn}
              >
                Forgot password
              </button>
            </div>
          </form>
        </div>
      </div>

      {showForgot && (
        <ForgotPasswordModal onClose={() => {
  logInfo("Forgot password modal closed");
  setShowForgot(false);
}} />
      )}
    </>
  );
}

function ForgotPasswordModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [checkingUser, setCheckingUser] = useState(false);


  const handleUserIdSubmit = async () => {
    logInfo("Forgot password - user validation started", { userId });
  setErrorMsg("");
  setCheckingUser(true);

  try {
    logInfo("Calling validate-user API", { userId });
    const res = await fetch(
      "https://mobile.coastal.bank.in:5001/api/forgot-password/validate-user",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      }
    );

    let data = {};
    try {
      data = await res.json();
      logInfo("Validate-user API response", data);
    } catch {}

    if (!res.ok) {
  logWarn("User validation failed", {
    userId,
    status: res.status
  });
      if (res.status === 401 || res.status === 403) {
        setErrorMsg("User is not authorized. Contact Administrator.");
      } else {
        setErrorMsg("Server error. Please try again.");
      }
      setCheckingUser(false);
      return;
    }

    logSuccess("User validated successfully", {
  userId,
  securityQuestion: data.securityQuestion
});
    setSecurityQuestion(data.securityQuestion);
    setStep(2);

  } catch (err) {
  logError("Validate-user API error", { userId, err });
    setErrorMsg("Server error. Please try again.");
  }

  setCheckingUser(false);
};


const handleSavePassword = async () => {
  logInfo("Password reset started", { userId });
  setErrorMsg("");

if (newPassword !== confirmPassword) {
  logWarn("Password mismatch during reset", { userId });
    setErrorMsg("Passwords do not match");
    return;
  }

  try {
    logInfo("Calling reset-password API", { userId });
    const res = await fetch(
      "https://mobile.coastal.bank.in:5001/api/forgot-password/reset-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          securityAnswer,
          newPassword
        })
      }
    );

    const data = await res.json();
    logInfo("Reset-password API response", data);

    if (!res.ok) {
  logError("Password reset failed", {
    userId,
    message: data.message
  });
      setErrorMsg(data.message || "Failed to reset password");
      return;
    }

    logSuccess("Password reset successful", { userId });
    alert("Password updated successfully. Please login.");
    onClose(); // close modal

  } catch (err) {
  logError("Reset-password API error", { userId, err });
    setErrorMsg("Server error. Please try again.");
  }
};


const handleVerifyAnswer = async () => {
  logInfo("Security answer verification started", { userId });
  setErrorMsg("");

  try {
    logInfo("Calling verify-answer API", { userId });
    const res = await fetch(
      "https://mobile.coastal.bank.in:5001/api/forgot-password/verify-answer",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          securityAnswer
        })
      }
    );

    const data = await res.json();
    logInfo("Verify-answer API response", data);

    if (!res.ok) {
  logWarn("Security answer incorrect", {
    userId,
    message: data.message
  });
      setErrorMsg(data.message || "Invalid security answer");
      return;
    }

    logSuccess("Security answer verified", { userId });
    // ✅ Only now allow password reset
    setStep(3);

  } catch (err) {
  logError("Verify-answer API error", { userId, err });
    setErrorMsg("Server error. Please try again.");
  }
};


  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          Forgot Password
          <span style={styles.close} onClick={onClose}>×</span>
        </div>

        {/* STEP 1 – USER ID */}
{step === 1 && (
  <>
    <label>User ID</label>
    <input
      value={userId}
      onChange={(e) => setUserId(e.target.value)}
      style={styles.input}
    />

    {errorMsg && (
      <div style={{ color: "red", fontSize: 13, marginBottom: 10 }}>
        {errorMsg}
      </div>
    )}

    <button
      style={styles.btn}
      disabled={!userId || checkingUser}
      onClick={handleUserIdSubmit}
    >
      {checkingUser ? "Verifying..." : "Submit"}
    </button>
  </>
)}

        {/* STEP 2 – SECURITY QUESTION */}
{step === 2 && (
  <>
    <label>Security Question</label>

    <input
      type="text"
      value={securityQuestion || "Your registered security question"}
      disabled
      style={{ ...styles.input, backgroundColor: "#f5f5f5" }}
    />

    <label>Your Answer</label>
    <input
      type="text"
      value={securityAnswer}
      onChange={(e) => setSecurityAnswer(e.target.value)}
      style={styles.input}
    />

    {errorMsg && (
      <div style={{ color: "red", fontSize: 13, marginBottom: 10 }}>
        {errorMsg}
      </div>
    )}

    <button
      style={styles.btn}
      disabled={!securityAnswer}
      onClick={handleVerifyAnswer}
    >
      Verify
    </button>
  </>
)}

        {/* STEP 3 – RESET PASSWORD */}
        {step === 3 && (
          <>
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={styles.input}
            />

            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
            />

            <button
  style={styles.btn}
  disabled={
    !newPassword ||
    !confirmPassword ||
    newPassword !== confirmPassword
  }
  onClick={handleSavePassword}
>
  Save Password
</button>

{newPassword && confirmPassword && newPassword !== confirmPassword && (
  <div style={{ color: "red", fontSize: 12 }}>
    Passwords do not match
  </div>
)}
          </>
        )}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    backgroundColor: "#f0f4ff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "fixed",
    inset: 0
  },
  card: {
    backgroundColor: "#fff",
    width: 380,
    borderRadius: 8,
    boxShadow: "0px 2px 10px rgba(0,0,0,0.1)"
  },
  header: {
    backgroundColor: "#007bff",
    padding: 24,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    color: "#fff",
    fontSize: 24,
    fontWeight: 600
  },
  subHeader: {
    fontSize: 13,
    marginTop: 4,
    opacity: 0.9
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 16,
    border: "1px solid #ddd",
    borderRadius: 4
  },
  loginBtn: {
    width: "100%",
    padding: 10,
    backgroundColor: "#007bff",
    border: "none",
    color: "#fff",
    borderRadius: 4,
    cursor: "pointer",
    fontWeight: 600
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#007bff",
    cursor: "pointer"
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.3)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999
  },
  modal: {
    background: "#fff",
    width: 420,
    padding: 24,
    borderRadius: 8
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 20,
    display: "flex",
    justifyContent: "space-between"
  },
  close: {
    cursor: "pointer",
    fontSize: 20
  },
  btn: {
    width: "100%",
    padding: 10,
    backgroundColor: "#007bff",
    border: "none",
    color: "#fff",
    borderRadius: 4,
    fontWeight: 600
  }
};
