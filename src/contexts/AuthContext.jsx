import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/firebase";

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

  const updateUserProfile = async (updates, photoFile = null) => {
    if (!currentUser) throw new Error("No user logged in");

    try {
      let photoURL = updates.photoURL;

      // Upload photo if provided
      if (photoFile) {
        const storageRef = ref(storage, `profile-photos/${currentUser.uid}`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }

      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: updates.fullName,
        photoURL: photoURL || currentUser.photoURL,
      });

      // Update Firestore document
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        fullName: updates.fullName,
        phone: updates.phone || "",
        address: updates.address || "",
        photoURL: photoURL || currentUser.photoURL,
      });

      // Update local state
      setUserData(prev => ({
        ...prev,
        fullName: updates.fullName,
        phone: updates.phone || "",
        address: updates.address || "",
        photoURL: photoURL || prev.photoURL,
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
