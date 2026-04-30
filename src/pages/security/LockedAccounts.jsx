import { useEffect, useState } from "react";

const BASE_URL = "https://mobile.coastal.bank.in:5001";

export default function LockedAccounts() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [unlockLoading, setUnlockLoading] = useState(false);

  const fetchLockedUsers = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/locked-users`, {
  headers: {
    userId: localStorage.getItem("userId")
  }
});
      const data = await res.json();

      setUsers(data || []);
    } catch (err) {
      alert("Failed to fetch locked users");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchLockedUsers();
  }, []);

  const openUnlockModal = (row) => {
    setSelectedUser(row);
    setNewPassword("");
    setShowModal(true);
  };

  const handleUnlock = async () => {
    if (!newPassword) {
      alert("Enter password");
      return;
    }

    try {
      setUnlockLoading(true);

      const res = await fetch(`${BASE_URL}/api/unlock-user`, {
        method: "POST",
        headers: {
  "Content-Type": "application/json",
  userId: localStorage.getItem("userId")
},
        body: JSON.stringify({
          userId: selectedUser.userId,
          newPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed");
        setUnlockLoading(false);
        return;
      }

      alert("Account unlocked successfully");

      setShowModal(false);
      fetchLockedUsers();
    } catch (err) {
      alert("Server error");
    }

    setUnlockLoading(false);
  };

  return (
    <>
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.topBar}>
            <div style={styles.heading}>Locked Accounts</div>

            <div style={styles.count}>
              No of total records is : {users.length}
            </div>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>S.No</th>
                  <th style={styles.th}>User ID</th>
                  <th style={styles.th}>User Name</th>
                  <th style={styles.th}>Failed Attempts</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={styles.loading}>
                      Loading...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={styles.loading}>
                      No locked users found
                    </td>
                  </tr>
                ) : (
                  users.map((row, index) => (
                    <tr key={row.userId}>
                      <td style={styles.td}>{index + 1}</td>
                      <td style={styles.td}>{row.userId}</td>
                      <td style={styles.td}>{row.userName}</td>
                      <td style={styles.td}>{row.failedAttempts}</td>
                      <td style={styles.td}>
                        <span style={styles.lockedBadge}>Locked</span>
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.unlockBtn}
                          onClick={() => openUnlockModal(row)}
                        >
                          Unlock
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>Unlock Account</div>

            <div style={styles.label}>
              User ID : <b>{selectedUser?.userId}</b>
            </div>

            <input
              type="password"
              placeholder="Enter New Temporary Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={styles.input}
            />

            <div style={styles.modalBtns}>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button
                style={styles.submitBtn}
                onClick={handleUnlock}
                disabled={unlockLoading}
              >
                {unlockLoading ? "Please wait..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  page: {
    padding: 24,
    background: "#f4f7fb",
    minHeight: "100vh"
  },

  card: {
    background: "#fff",
    borderRadius: 10,
    padding: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20
  },

  heading: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1e3a8a"
  },

  count: {
    fontSize: 15,
    color: "#555"
  },

  tableWrap: {
    overflowX: "auto"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse"
  },

  th: {
    background: "#eef2ff",
    padding: 12,
    border: "1px solid #ddd",
    textAlign: "left"
  },

  td: {
    padding: 12,
    border: "1px solid #eee"
  },

  loading: {
    padding: 20,
    textAlign: "center"
  },

  lockedBadge: {
    background: "#fee2e2",
    color: "#dc2626",
    padding: "6px 12px",
    borderRadius: 20,
    fontWeight: 600,
    fontSize: 13
  },

  unlockBtn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 6,
    cursor: "pointer"
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999
  },

  modal: {
    background: "#fff",
    width: 420,
    borderRadius: 10,
    padding: 24
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 18
  },

  label: {
    marginBottom: 12
  },

  input: {
    width: "100%",
    padding: 10,
    border: "1px solid #ddd",
    borderRadius: 6,
    marginBottom: 20
  },

  modalBtns: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10
  },

  cancelBtn: {
    padding: "10px 18px",
    border: "1px solid #ccc",
    background: "#fff",
    borderRadius: 6,
    cursor: "pointer"
  },

  submitBtn: {
    padding: "10px 18px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    borderRadius: 6,
    cursor: "pointer"
  }
};