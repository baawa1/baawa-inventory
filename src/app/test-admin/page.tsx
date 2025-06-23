"use client";

import bcrypt from "bcryptjs";

export default async function TestCreateAdmin() {
  const handleCreateAdmin = async () => {
    try {
      const hashedPassword = await bcrypt.hash("admin123", 12);

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: "Admin",
          lastName: "User",
          email: "admin@test.com",
          password: "admin123", // Will be hashed by the API
          role: "ADMIN",
        }),
      });

      if (response.ok) {
        const user = await response.json();
        alert("Admin user created successfully!");
        console.log("Created user:", user);
      } else {
        const error = await response.text();
        alert("Failed to create admin user: " + error);
        console.error("Error:", error);
      }
    } catch (error) {
      console.error("Error creating admin user:", error);
      alert("Error: " + error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Create Admin User</h1>
      <button
        onClick={handleCreateAdmin}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Create Admin User
      </button>
      <p className="mt-4 text-sm text-gray-600">
        This will create an admin user with email: admin@test.com and password:
        admin123
      </p>
    </div>
  );
}
