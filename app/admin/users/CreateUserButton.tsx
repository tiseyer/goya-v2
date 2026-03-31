'use client';

export default function CreateUserButton() {
  return (
    <button
      onClick={() => window.alert('User creation coming soon — invite users via email.')}
      className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      + Create User
    </button>
  );
}
