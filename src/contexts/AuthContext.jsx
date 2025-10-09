import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        setUserData(userDoc.exists() ? userDoc.data() : null);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

    const logout = () => { 
        return auth.signOut();
  }

  const value = {
    currentUser,
    userData,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
