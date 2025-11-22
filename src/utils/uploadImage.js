/**
 * Global Cloudinary Upload Helper for VetConnect
 * 
 * Configuration:
 * - Cloud Name: dghmjbhto
 * - Upload Preset: vetconnect
 * 
 * This is the ONLY image upload function used across the entire project.
 */

/**
 * Upload an image file to Cloudinary
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} The secure URL of the uploaded image
 * @throws {Error} If upload fails or file is invalid
 */
export async function uploadImageToCloudinary(file) {
  // Validate file
  if (!file) {
    throw new Error("No file provided");
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error("Invalid file type. Please upload a JPG, PNG, or WebP image.");
  }

  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    throw new Error("File size exceeds 5MB. Please choose a smaller image.");
  }

  const cloudName = "dghmjbhto";
  const uploadPreset = "vetconnect";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    const data = await response.json();

    if (data.secure_url) {
      console.log("✅ Image uploaded to Cloudinary:", data.secure_url);
      return data.secure_url;
    }

    throw new Error("Cloudinary upload failed: No secure URL returned");
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Upload multiple images to Cloudinary
 * @param {File[]} files - Array of image files to upload
 * @returns {Promise<string[]>} Array of secure URLs
 */
export async function uploadMultipleImagesToCloudinary(files) {
  if (!files || files.length === 0) {
    throw new Error("No files provided");
  }

  try {
    const uploadPromises = files.map(file => uploadImageToCloudinary(file));
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error("❌ Multiple image upload error:", error);
    throw error;
  }
}

/**
 * Delete an image from Cloudinary (requires backend implementation)
 * Note: Direct deletion from client-side requires signed requests
 * This is a placeholder for future implementation
 * @param {string} publicId - The public ID of the image to delete
 */
export async function deleteImageFromCloudinary(publicId) {
  console.warn("Image deletion requires backend implementation for security");
  // This would typically be done through a backend API endpoint
  // For now, we'll just remove the reference from Firestore
  return true;
}

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary secure URL
 * @returns {string} The public ID
 */
export function extractPublicId(url) {
  if (!url) return null;
  
  try {
    // Extract public ID from URL
    // Format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex !== -1 && uploadIndex + 2 < parts.length) {
      const filenamePart = parts.slice(uploadIndex + 2).join('/');
      // Remove file extension
      return filenamePart.substring(0, filenamePart.lastIndexOf('.'));
    }
  } catch (error) {
    console.error("Error extracting public ID:", error);
  }
  
  return null;
}
