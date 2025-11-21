import React from "react";
import PetCard from "./PetCard";

export default function PetList({ pets, onEdit, onViewRecords, userId }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">My Pets</h2>
      {pets.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No pets added yet.</p>
      ) : (
        <div>
          {pets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              userId={userId}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
