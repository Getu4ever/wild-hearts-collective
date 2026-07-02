import { Suspense } from "react";
import { BookingForm } from "@/app/components/booking-form";

export default function BookingFormSection() {
  return (
    <Suspense fallback={<div className="text-sm text-muted">Loading booking form...</div>}>
      <BookingForm />
    </Suspense>
  );
}
