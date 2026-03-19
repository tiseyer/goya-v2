import EventForm from '../components/EventForm';

export default function NewEventPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Add New Event</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Fill in the details below to create a new event.</p>
      </div>
      <EventForm />
    </div>
  );
}
