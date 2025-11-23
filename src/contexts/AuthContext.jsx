import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            // ✅ Merge Firestore data + UID + email
            setUserData({
              uid: user.uid,
              email: user.email,
              ...userSnap.data(),
            });
          } else {
            // Fallback if no Firestore doc exists yet
            setUserData({
              uid: user.uid,
              email: user.email,
            });
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = () => signOut(auth);

  const updateUserProfile = async (updates) => {
    if (!currentUser) throw new Error("No user logged in");

    try {
      // photoURL is already uploaded to Cloudinary
      const photoURL = updates.photoURL || currentUser.photoURL;

      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: updates.fullName,
        photoURL,
      });

      // Prepare Firestore update data
      const firestoreUpdates = {
        fullName: updates.fullName,
        phone: updates.phone || "",
        address: updates.address || "",
        photoURL,
      };

      // Add clinic-specific fields if provided
      if (updates.clinicName !== undefined) {
        firestoreUpdates.clinicName = updates.clinicName;
      }
      if (updates.portfolio !== undefined) {
        firestoreUpdates.portfolio = updates.portfolio;
      }

      // Update Firestore document
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, firestoreUpdates);

      // Update local state to trigger UI refresh
      setUserData(prev => ({
        ...prev,
        ...firestoreUpdates,
      }));

      return { success: true };
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userData,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
