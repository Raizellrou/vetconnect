import React from "react";

export default function PetList({ pets, onEdit, onViewRecords }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">My Pets</h2>
      {pets.length === 0 ? (
        <p>No pets added yet.</p>
      ) : (
        <ul>
          {pets.map((pet) => (
            <li
              key={pet.id}
              className="border p-3 rounded mb-2 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{pet.pet_name}</p>
                <p className="text-sm text-gray-600">
                  {pet.species} • {pet.breed || "N/A"} • {pet.gender}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onViewRecords(pet.id)}
                  className="bg-green-500 text-white px-3 py-1 rounded"
                >
                  View Records
                </button>
                <button
                  onClick={() => onEdit(pet)}
                  className="bg-blue-500 text-white px-3 py-1 rounded"
                >
                  Edit
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
